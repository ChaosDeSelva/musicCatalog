var Browser = require("zombie");
var assert = require("assert");

// Load the page from localhost
browser = new Browser({ debug: true })

browser.visit("http://localhost:3000/").then(function() {
    assert.equal(browser.text("H1"), "King Crimson Live Music Catalog");

    console.log('King Crimson Live Music Catalog Header Text : Passed!');

}).fail(function(error) {
    console.log("Oops", error);
});

browser.visit("http://localhost:3000/").then(function() {
    assert.ok(browser.query("#filterInput"));

    console.log('Find Filter Input Field : Passed!');

    assert.ok(browser.query("#applyFilter"));

    console.log('Find Apply Filter Button : Passed!');

    var item = browser.document.getElementById("filterInput");
    item.value = "Live";

    browser.pressButton("#applyFilter",function(){
	var rows = browser.document.getElementById("kingTable").getElementsByTagName("tr");
	var rowsShownCount = 0;

	for ( var i = 0; i < rows.length; i++ ){
	    if (rows[i].style.display !== 'none'){
		rowsShownCount++;
	    }
	}

	assert.equal(rowsShownCount, 27);
	console.log('King Crimson Live Music Catalog Filter Input = Live returned 27 matches : Passed!');
    });


}).fail(function(error) {
    console.log("Oops", error);
});



