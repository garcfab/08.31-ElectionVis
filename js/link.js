var link = {}
link.init = function (sel) {
	if (sel.empty()) {return};
	//Get main vars
	var order = +sel.attr("order")
	var nestType = columnData[order].nestType
	var filters = columnData[order].filters
	var w = parseFloat(sel.style("width"))
	var h = parseFloat(sel.style("height"))

	var last = filters[filters.length-1].y2
	if (last<9) {last=9};

	sel.selectAll("svg").data([1])
		.enter().append("svg")
		.attr({
			width: w, height: h
		})
	var svg = sel.select("svg")

	svg.selectAll("path").data([1])
		.enter().append("path")
		.attr({
			"d": "M 0,8 l "+w+",0 L "+(+w+2)+","+h+" C "+w/2+","+8+" "+w/2+","
				+8+" 0,"+8,
			fill: "white",
			stroke: "white"
		})
	svg.select("path")
		.transition()
		.attr({
			"d": "M 0,8 l "+w+",0 L "+(+w+2)+","+h+" C "+w/2+","+h+" "+w/2+","
				+last+" 0,"+last,
			fill: c2,
			stroke: c2
		})
}

link.remove = function(sel){
	if (sel.empty()) {return};

	var w = parseFloat(sel.style("width"))
	var h = parseFloat(sel.style("height"))

	sel.select("path")
		.transition()
		.attr({
			"d": "M 0,8 l "+w+",0 L "+(+w+2)+","+h+" C "+w/2+","+8+" "+w/2+","
				+8+" 0,"+8,
			fill: "white",
			stroke: "white"
		})
}
