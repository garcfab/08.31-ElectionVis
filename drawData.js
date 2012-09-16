function drawData (data) {
	d3.select(".drawData").remove()

	var cont = d3.select("body").append("div")
		.attr("class", "drawData")
		.style({
			width: "1400px", 
			padding: "12px", margin: "0 auto"
		})

	cont.datum(data)
		.call(drawCycle)

	function drawCycle (d3Sel) {
		var d = d3Sel.datum()

		if (type(d) == "Array") {
			d3Sel.selectAll("div").data(d)
				.enter().append("div")
				.attr("class", "array")
				.each(function(d){
					d3.select(this)
						.datum(d)
						.call(drawCycle)
				})

		} else if ((type(d) == "Object")) {
			var entries = d3.entries(d)
			var properties = d3Sel.selectAll("div").data(d3.entries(d))
				.enter().append("div")
				.attr("class", "objectProperty")

			// console.log(entries)
			properties.append("span")
				.attr("class", "objectKey")
				.text(function(d){return d.key + ": "})

			properties.append("span")
				.attr("class", "objectValue")
				// .datum(function(d){return d.value})
				.each(function(d){
					d3.select(this)
						.datum(d.value)
						.call(drawCycle)
				})

		} else if ((type(d) == "String")) {
			d3Sel.append("span")
				.attr("class", "string")
				.text("\""+ d + "\"")

		} else if ((type(d) == "Number")) {
			d3Sel.append("span")
				.attr("class", "number")
				.text(d)

		} else if ((type(d) == "Boolean" || !type(d))) {
			d3Sel.append("span")
				.attr("class", "boolean")
				.each(function(d){
					if (d) {
						d3.select(this).text("true")
					} else if (d == undefined){
						d3.select(this).text("undefined")
							.style("background-color", "lightgray")
					}  else {
						d3.select(this).text("false")
					};
				})

		}
	}
	
	function type(o){
	    return !!o && Object.prototype.toString.call(o).match(/(\w+)\]/)[1];
	}
}