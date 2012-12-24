categorical = {}
categorical.init = function () {
	
	var sel = d3.select("#categorical")
	var w = parseFloat(sel.style("width"))
	var h = parseFloat(sel.style("height"))

	var svg = sel.selectAll("svg.main").data([0])
	svg.enter().append("svg")
		.attr({
			width: w, height: h, "class": "main"
		})

	var linkW = 10;
	var columnW = (100 - 2*linkW)/3

	linkW = linkW*w/100
	columnW = columnW*w/100

	// Pole vars
	var pole = {}
	pole.w = 11
	pole.radius = pole.w/2
	
	// Pole Data
	var poles = columnData.map(function(e,i){
		return {
			x: (columnW/2) + (columnW + linkW)*i
			// nestType: e.nestType,
			// filters: e.filters
		}
	})

	// DRAW
	var nestTypes = columnData.map(function (e){
		return e.nestType
	})

	//
	var lastScale
	[0,1].forEach(function(e){drawGroup(e)})
	drawLastGroup()

	function drawLastGroup(){

		var order = 2
		var fromNestType = nestTypes[order]

		if (!columnData[order].d) {return false};

		var dCircle = d3.nest()
			.key(function(d){return d[fromNestType] })
			.rollup(function(d){
				return 0
			})
			.entries(columnData[order].d)
		var group = svg.selectAll("g.p"+order).data([0])
		group.exit().remove()
		group.enter().append("g")
			.classed("p"+order, true)
			.attr("transform", "translate("+poles[order].x+",0)")

		var rect = group.selectAll("rect").data([0])
		rect.enter().append("rect")
		rect.attr({
				x: -pole.w/2,
				y: 0, width: pole.w, height: h,
				rx: pole.radius, ry: pole.radius,
				fill: "black"
			})

		var circleP = group.selectAll("circle.p").data(dCircle)
		circleP.exit().remove()
		circleP.enter().append("circle")
		circleP.classed("p", true)
			.attr({
				cx: 0, cy: function(d){return lastScale(d.key)},
				r: 4,
				fill: "white"
			})

	}

	function drawGroup(order){

		var group = svg.selectAll("g.p"+order).data([0])
		group.exit().remove()
		group.enter().append("g")
		group.classed("p"+order, true)
			.attr("transform", "translate("+poles[order].x+",0)")

		group.selectAll("rect").data([0])
			.enter().append("rect")
			.attr({
				x: -pole.w/2,
				y: 0, width: pole.w, height: h,
				rx: pole.radius, ry: pole.radius,
				fill: "black"
			})

		var fromNestType = nestTypes[order]
		var toNestType = nestTypes[order+1]
		if (!columnData[order].d) {return false};
		var thisData = columnData[order].d

		var dCircle = d3.nest()
			.key(function(d){return d[fromNestType] })
			.key(function(d){return d[toNestType] })
			.rollup(function(d){
				return 0
			})
			.entries(thisData)
		var dLine = d3.nest()
			.key(function(d){return d[fromNestType] })
			.key(function(d){return d[toNestType] })
			.rollup(function(d){
				return 0
			})
			.entries(data)

		var fromDomain = []
		var toDomain = []


		var dLine2 = d3.merge(dLine.map(function(key1){
			fromDomain.push(key1.key)
			return key1.values.map(function(key2){
				toDomain.push(key2.key)
				return {from: key1.key, to: key2.key}
			})
		}))


		if (lastScale && order>0) {var fromScale = lastScale} 
			else{var fromScale = createScale(fromDomain)}

		if (order==1) {
			toDomain = []
			fromScale.domain().forEach(function(key1){
				dLine.filter(function(e){return e.key==key1})
					[0].values
					.forEach(function(key2){
						toDomain.push(key2.key)
					})
			})
		}
		dLine = dLine2
		var toScale = createScale(toDomain)

		lastScale = toScale

		function createScale (domain) {
			domain = d3.nest()
				.key(function(d){return d})
				.rollup(function(d){
					return 0
				})
				.entries(domain)
				.map(function(e){return e.key})
			return d3.scale.ordinal().domain(domain).rangePoints([0+20,h-20], 1)
		}

		var dCircleSel
		var dLineSel = function (){
			if (columnData[order+1].d.lenght==0) return [{from: "Cami", to:"Luis"}]

			dCircleSel = d3.nest()
				.key(function(d){return d[fromNestType] })
				.key(function(d){return d[toNestType] })
				.rollup(function(d){
					return 0
				})
				.entries(columnData[order+1].d)
			return d3.merge(dCircleSel.map(function(key1){
				return key1.values.map(function(key2){
					return {from: key1.key, to: key2.key}
				})
			}))
		}()

		var pathAttr = {
				d: function(d,i){
					var x0 = 0
					var y0 = fromScale(d.from)
					var x1 = columnW+linkW
					var y1 = toScale(d.to)
					return "M"+x0+","+y0+" C"+((+x1-x0)/2+x0)+","+y0+" "
						+((+x1-x0)/2+x0)+","+y1+" "+x1+","+y1
				}, fill: "none"
			}


		var pathP = group.selectAll("path.p").data(dLine)
		pathP.exit().remove()
		pathP.enter().insert("path", "path.s, rect")
		pathP.classed("p", true)
			.attr(pathAttr)
			.attr({
				stroke: "lightgray", "stroke-width": 1
			})
			.on("mouseover", function(d){
				var tool = d3.select(".tooltip0")
				tool.select("p").text(d.from)
				var aHeight = parseFloat(tool.style("height"))/2
				tool.style({
						top: fromScale(d.from)-aHeight+"px",
						visibility: "visible",
						left: order*(columnW+linkW)+"px",
						width: columnW/2-pole.w-2+"px",
						"background-color": "black", color: "white"
					})
				tool = d3.select(".tooltip1")
				tool.select("p").text(d.to)
				aHeight = parseFloat(tool.style("height"))/2
				tool.style({
						top: toScale(d.to)-aHeight+"px",
						visibility: "visible",
						left: columnW*1.5+linkW+ order*(columnW+linkW)+pole.w+2+"px",
						width: columnW/2-pole.w-2+"px",
						"background-color": "black", color: "white"
					})

				var aNode = d3.select(this)
					.attr({
						"stroke": "gray", "stroke-width": 3
					})
					.node()

				group.node().insertBefore(aNode, group.select("path.s, rect").node())
			})
			.on("mouseout", function(){
				d3.select(".tooltip0").style({visibility: "hidden"})
				d3.select(".tooltip1").style({visibility: "hidden"})
				d3.select(this).attr({
					"stroke": "lightgray", "stroke-width": 1
				})
			})

			
			var pathS = group.selectAll("path.s").data(dLineSel)
			pathS.exit()
				.remove()
			pathS.enter().insert("path", "rect")
				.classed("s", true)
				.attr("stroke", "lightgray")
				.attr("stroke-width", 2)
				.attr("stroke", c2)
			pathS.attr(pathAttr)
				.on("mouseover", function(d,i){

					var tool = d3.select(".tooltip0")
					tool.select("p").text(dLineSel[i].from)
					var aHeight = parseFloat(tool.style("height"))/2
					tool.style({
							top: fromScale(dLineSel[i].from)-aHeight+"px",
							visibility: "visible",
							left: order*(columnW+linkW)+"px",
							width: columnW/2-pole.w-2+"px",
							"background-color": c2, color: "white"
						})
					tool = d3.select(".tooltip1")
					tool.select("p").text(dLineSel[i].to)
					aHeight = parseFloat(tool.style("height"))/2
					tool.style({
							top: toScale(dLineSel[i].to)-aHeight+"px",
							visibility: "visible",
							left: columnW*1.5+linkW+ order*(columnW+linkW)+pole.w+2+"px",
							width: columnW/2-pole.w-2+"px",
							"background-color": cWhite, color: "black"
						})

					var aNode = d3.select(this)
						.attr({
							"stroke": c2.darker(.8), "stroke-width": 3
						})
						.node()

					group.node().insertBefore(aNode, group.select("rect").node())
				})
				.on("mouseout", function(){
					d3.select(".tooltip0").style({visibility: "hidden"})
					d3.select(".tooltip1").style({visibility: "hidden"})
					d3.select(this).attr({
						"stroke": c2, "stroke-width": 2
					})
				})
				
		var circleP = group.selectAll("circle.p").data(dCircle)
		circleP.exit().remove()
		circleP.enter().insert("circle", "circle.s")
		circleP.classed("p", true)
			.attr({
				cx: 0, cy: function(d){return fromScale(d.key)},
				r: 4,
				fill: "white"
			})

		var circleS = group.selectAll("circle.s").data(dCircleSel)
		circleS.exit().remove()
		circleS.enter().append("circle")
		circleS.classed("s", true)
			.attr({
				cx: 0, cy: function(d){return fromScale(d.key)},
				r: 3,
				fill: c2
			})
	}

	//drawTip()
	// function drawTip() {
	// 	var r = 5
	// 	var m = 2
	// 	var tipN = 10
	// 	var w = 110
	// 	var h = 40
	// 	var tip = sel.select("svg.tip1")
	// 		.attr({width: 200, height: 200})
	// 	var pathD = [
	// 		"M", [r+m,m],
	// 		"l", [w-r*2,0],
	// 		"a", [r,r], 0, [0,1], [r,r],
	// 		"l", [0,h/2-(r)-tipN/2], "l", [tipN,tipN/2], 
	// 		"l", [-tipN,tipN/2], "l", [0,h/2-(r)-tipN/2],
	// 		"a", [r,r], 0, [0,1], [-r,r],
	// 		"l", [-(w-r*2),0],
	// 		"a", [r,r], 0, [0,1], [-r,-r],
	// 		"l", [0,-(h-r*2)],
	// 		"a", [r,r], 0, [0,1], [r,-r],
	// 		]
	// 	pathD.forEach(function(e){
	// 			if (type(e)=="Array") {e=e.join(",")}
	// 		})
	// 	pathD = pathD.join(" ")

	// 	var path = tip.select("path")
	// 		.attr({
	// 			d: pathD,
	// 			stroke: "black", fill: "black"
	// 		})
	// }


}














