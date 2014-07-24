/*
 * AUTHOR : JACOB LASHLEY
 * DATE : JUNE 10 2014
 * King Crimson Live Music Catalog
 *
 * This was a project to demonstrate create a table that parses in CSV files.  JQUERY was used only to load in the files with deferred functionality.
 * The remaining core of the project is vanilla javascript.
 *
 */

$(document).ready(function(){

    /*
     * CONFIGS - DATA OBJECT
     */
    var data = {
        //Array holding table header information
        headerArray: ["band name", "album title", "number of discs", "release date", "recording date", "personnel"],

        //Id of the header that is hidden when drawn
        headersHidden: {},

        //Order the headers are being drawn in
        headersOrder: [0,1,2,3,4,5],

        //Clone of the table post filter state
        filteredTable: 'undefined',
        filteredTableHeader: 'undefined',

        //The array codes stored during filter action; will result in a 2d array
        filterObject: {}, //ex. {"filter":"All", "value":99}

        //Maintains filter object range
        filterIndex: 0,

        //Sort object holding properties of the tables sorted status
        sortArray: {"index":-1, "inverse":false, "clone":-1, "pre": -1 },

        //Data objects to hold the text loaded from the CSV files
        albums: 'undefined',
        albums_personnel: 'undefined',
        personnel: 'undefined',

        //JSON representation of the CSV data constructed into its official data structure
        albums_full: {}

    };

    /*
     * CONTROLLER - METHOD OBJECT LITERAL
     */
    var controller = {

        /*
         * This will apply filter
         * @param val String - value of the search input
         * @param domList NodeList - list of DOM nodes
         * @param tag String - combobox selected value
         *
         * @return filteredArr Array - array of all filtered nodes
         */
        applyFilter: function (val, domList, tag){
            //Split the current value of search input and convert to an array
            var str = val.split(" ");
            var arr = Array.prototype.slice.call(domList);

            //Loop the array and hide anything that is a non-empty value
            for ( var i = 0; i < arr.length; i++ ){
                if ( arr[i] === "" ){
                    arr[i].style.display = "";
                } else {
                    arr[i].style.display = "none";
                }
            }

            //Index of the header
            var headerIdx = data.headersOrder.indexOf(data.headerArray.indexOf(tag));
            //Clone the array and remove hidden headers
            var tmp = data.headersOrder.slice(0);
            for ( var key in data.headersHidden ){
                tmp.splice(data.headersHidden[key].index,1)
            }
            headerIdx = tmp.indexOf(data.headerArray.indexOf(tag));


            //Filter table to find matching cells
            var filteredArr =  arr.filter(function (v) {
                for (var d = 0; d < str.length; ++d) {
                    for (var it = 0, cell; cell = v.cells[it]; it++) {

                        //If regex is found in cell text...
                        var myRegExp = new RegExp(str[d].toLowerCase());
                        if (myRegExp.test(cell.textContent.toLowerCase())){
                            //...and the header index is not -1 or the same as the cell proceed
                            if (headerIdx === -1 || v.cells[it].cellIndex === headerIdx){
                                return true;
                            }
                        }
                    }
                }
                return false;
            });

            //Hide all the elements in the array
            for ( var j = 0; j < filteredArr.length; j++ ){
                filteredArr[j].style.display = "";
            }

            //Set the records shown value
            document.getElementById('shownRecords').textContent = filteredArr.length;

            return filteredArr;
        },

        /*
         * This will create a new table cell
         * @param obj Json || Object - the text object of content of the cell
         *
         * @return cell Element - table cell to append to the table body
         */
        createCell: function (obj){
            //create a table cell and check if passed in text is something
            var cell = document.createElement('td');
            var tmpText = "";

            if ( obj === "undefined" || obj.length <= 0 ){
                obj = "—";
            }

            if ( typeof obj == "object" ){
                //loop the JSON and find create the cell text
                var counter = 0;
                for ( var key in obj ){
                    if ( obj.hasOwnProperty(key) )
                    tmpText += obj[key].given_name + ' ' + obj[key].surname;

                    //If the text is an object then split text as comma separated values
                    if ( counter !== obj.length-1 ){
                        tmpText += ", ";
                    }
                    counter++;
                }
            } else {
                //Else assign text from the text string passed in and not the json object
                tmpText = obj;
            }

            //Append values to the table cell
            cell.appendChild(document.createTextNode(tmpText));

            return cell;
        },

        /*
         * This will create a new table cell for cells where the text requires a link
         * @param title String - The text to put into the cell text
         * @param link String - URL to assign to the a element
         *
         * @return cell Element - table cell to append to the table body
         */
        createAnchorCell: function (title, link){
            //Create a new table cell and then an a tag
            var cell = document.createElement('td');
            var aTag = document.createElement('a');

            //Set the values of the atag and make sure to parse out the double quotes
            aTag.setAttribute('href', link.replace(/\"/g, ""));
            aTag.setAttribute('target', "_blank"); //Open in a blank tab/window
            aTag.textContent = title;
            cell.appendChild(aTag);
            return cell;
        },

        /*
         * Helper to put cells into a row
         * @param row Element - this is the element of the row
         * @param idx number - index / json key
         * @param cell Element - the cell element to append to the row
         */
        buildRowCells: function (row, idx, cell){
            if ( data.headersHidden.hasOwnProperty(idx) === false ){
                row.appendChild(cell);
            }
        },


        /*
         * Check for a valid date / used in sorting dates
         * @param date_regex String - the regex to find a valid date
         *
         * @return boolean of the fact that it is or is not a valud date
         */
        validateDate: function (d) {
            var date_regex = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/ ;
            return date_regex.test(d);
        },


        /*
         * Sort a table column
         * @param el Element - the table element
         * @param num Number - index of the column
         * @param inverse Boolean - direction of the sort
         *
         * @return inverse to send back the direction of the sort
         */
        sortTableColumns: function (el, num, inverse){
            //Get the table element
            var tableElmNodeList = document.querySelectorAll("#kingTable td");
            //Convert into an array and not a node list
            var tableElmArray = Array.prototype.slice.call(tableElmNodeList);
            var elm = el[num];

            //Clear all of the headers sort status so only one is showing at a time
            for ( var k = 0; k < el.length; k++ ){
                //If disabled or the current one is active do not change
                if ( el[k].getAttribute('data-state') !== 'sortDisabled'  ){ //&& k !== data.sortArray.index
                    el[k].setAttribute('data-state', 'sortNone');
                }
            }

            if ( typeof elm !== "undefined" ){
                //If sort is none but inverse is set then apply the sort order
                if ( elm.getAttribute('data-state') === 'sortNone' ){

                        //Inverse is false apply down
                        if ( data.sortArray.inverse === false ){
                            elm.setAttribute('data-state', 'sortDown');
                        } else {
                            elm.setAttribute('data-state', 'sortUp');
                        }

                } else {
                    //If the order was already set then toggle the state
                    elm.setAttribute('data-state', elm.getAttribute('data-state') === 'sortDown' ? 'sortUp' : 'sortDown');

                }
            }

            //Set the index as a property on the object to later be used in the scope context
            tableElmArray.idx = num;

            //Filter the array looking for cells that match the selected header index
            var filteredTableArray = tableElmArray.filter(function(me, idx, obj){
                return me.cellIndex === obj.idx;
            });

            //Sort method
            var sortElement = function (){
                var me = filteredTableArray;
                var sort = [].sort;

                return function(comparator, getSortable) {
                    getSortable = getSortable || function(){return me;};

                    //Create a map to be sorted
                    var placements = me.map(function(me){
                        var sortElement = getSortable.call(me);
                        var parentNode = sortElement.parentNode;

                        // A flag to store the DOM elements position
                        var  nextSibling = parentNode.insertBefore(
                            document.createTextNode(''),
                            sortElement.nextSibling
                        );

                        return function() {
                            //Check if the node is a descendant
                            if (parentNode === this) {
                                throw new Error(
                                    "Sorting descendants is invalid!"
                                );
                            }

                            // Insert before flag:
                            parentNode.insertBefore(this, nextSibling);

                            // Remove flag:
                            parentNode.removeChild(nextSibling);

                        };
                    });

                    //This will return the sort method for each item in the map
                    return sort.call(me, comparator).forEach(function(me, idx){
                        placements[idx].call(getSortable.call(me));
                    });
                };
            };

            //Add sort element as a method on the filteredTableArray object
            filteredTableArray.sortElement = sortElement();

            //Call filteredTableArray sort element
            filteredTableArray.sortElement(function(a, b){

                if ( controller.validateDate(a.textContent) && controller.validateDate(b.textContent) ){
                    //Sort dates
                    return new Date(a.textContent) > new Date(b.textContent) ? inverse ? -1 : 1 : inverse ? 1 : -1;

                } else {
                    //Sort values ... remove quotes from strings to give the correct order
                    return a.textContent.replace(/"/g, "") > b.textContent.replace(/"/g, "") ? inverse ? -1 : 1 : inverse ? 1 : -1;

                }

            }, function(){
                return this.parentNode;

            });

           inverse = !inverse;

           return inverse;
        },

        // Regular expression to parse the CSV values.
        objPattern: new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\"\\,\\r\\n]*))"),"gi"),

        /*
         * Take the CSV file and build an array of the mapping
         * @param strData String - text from an CSV file
         *
         * @return array of the parsed csv file
         */
        CSVtoRelationshipMatrix: function (strData ){
            // Create an array and give the array a default empty first row
            var arrData = [];

            // Create an array to hold our individual pattern and match groups
            var arrMatches = null;
            var headers = [];
            var definedHeaders = false;
            var counter = 0;
            var arrIndex = undefined;

            // Loop over the regular expression matches until we can no match.
            while (arrMatches = controller.objPattern.exec( strData )){
                // Get the delimiter that was found.
                var strMatchedDelimiter = arrMatches[ 1 ];

                // Check to see if it is a row delimiter.
                if ( strMatchedDelimiter.length && (strMatchedDelimiter != ',') ){
                    if ( !definedHeaders ){
                        definedHeaders = true;
                    }
                    counter = 0;
                }

                var strMatchedValue = arrMatches[ 3 ];

                //Find headers and store in an array
                if ( !definedHeaders ){
                    headers.push(strMatchedValue);
                } else {
                    //get values from each row and push into an array
                    if ( counter === 0 ){
                        arrIndex = strMatchedValue;

                    } else if ( counter === 1 ){
                        //create a 2d array for a lookup table to build the personnel
                        if ( typeof arrData[arrIndex] == "undefined" ){
                            var tmp = [];
                            tmp.push(strMatchedValue);
                            arrData[arrIndex] = tmp;
                        } else {
                            arrData[arrIndex].push(strMatchedValue);
                        }
                    }
                }
                counter++;
            }

            // Return the parsed data.
            return arrData;
        },


        /*
         * Take the CSV file and build a JSON holding the data
         * @param strData String - text from an CSV file
         *
         * @return object of the parsed csv file
         */
        CSVtoJSON: function ( strData ){

            // Create an array to hold our individual pattern
            // matching groups.
            var arrMatches = null;

            // Expected Outcome = ["id", "title", "group", "release_date", "no_of_discs", "wiki_link", "recording_date"]
            var headers = [];
            var headerCounter = 0;
            var jsonCollection = {};
            var activeJsonId = undefined;
            var jsonRecord = {};
            var definedHeaders = false;

            // Keep looping over the regular expression matches until we cannot find a match.
            while (arrMatches = controller.objPattern.exec( strData ) ){
                // Get the delimiter that was found.
                var strMatchedDelimiter = arrMatches[ 1 ];

                // Check to see if the given delimiter has a row delimiter.
                if ( strMatchedDelimiter.length && (strMatchedDelimiter != ",") ){
                    if ( !definedHeaders ){
                        definedHeaders = true;

                    } else {
                        jsonCollection[activeJsonId] = jsonRecord;
                        headerCounter = 0;
                    }
                }

                //Check to see quoted or unquoted
                var strMatchedValue = '';
                if (arrMatches[ 2 ]){
                    // We found a quoted value so unescape any double quotes.
                    strMatchedValue = '\"' + arrMatches[ 2 ] + '\"'; //.replace(new RegExp( "\"\"", "g" ),"\"");

                } else {
                    strMatchedValue = arrMatches[ 3 ];
                }

                //Build the initial headers
                if ( !definedHeaders ){
                    headers.push(strMatchedValue);
                } else {
                    //Then push data into JSON
                    if ( headerCounter === 0 ){
                        jsonRecord = {};
                        activeJsonId = strMatchedValue;
                        jsonCollection[activeJsonId] = {};

                    } else {
                        jsonRecord[headers[headerCounter]] = strMatchedValue;
                    }

                    headerCounter++;
                }
            }

            jsonCollection[activeJsonId] = jsonRecord;

            return jsonCollection;
        },


        /*
         * Create the mapping for the final JSON data structure
         * @param albums JSON - parsed csv data
         * @param albums_personnel Array - parsed csv data
         * @param personnel JSON - parsed csv data
         *
         * @return albums the completed mapping in JSON
         */
        buildRelationship: function (albums,albums_personnel,personnel){
            var arr = [];

            for ( var i = 0; i < albums_personnel.length; i++ ){
                if ( typeof albums_personnel[i] != "undefined" ){
                    for ( var j = 0; j < albums_personnel[i].length; j++ ){
                        var idx = albums_personnel[i][j];
                        arr.push(personnel[idx]);
                    }

                    albums[i]["personnel"] = arr;
                    arr = []
                }
            }
            return albums;
        },

        /*
         * This will look up all stored filters and apply them when the table is redrawn
         */
        applyFilterRedraw: function(){
            for ( var key in data.filterObject ){
                data.filteredTable = controller.applyFilter( data.filterObject[key].value, data.filteredTable , data.filterObject[key].filter );
            }
        },

        /*
         * Drill JSON to find if a value exist
         * @param index Number - the value we are looking for in the JSON
         *
         * @return boolean if the value was found
         */
        drillJSON: function(idx){
            for ( var key in data.headersHidden ){
                if ( data.headersHidden[key].index === idx ){
                    return true;
                }
            }
            return false;
        },

        /*
         * This will create the table
         * @param jsonCollection JSON - the JSON to be parsed and built into a table
         *
         */
        createTable: function (jsonCollection) {
            var kt = document.getElementById('kingTable');

            //If a table is found remove it
            if ( kt !== null ){
                kt.parentNode.removeChild(kt);
            }

            //Create the parts of the table
            var table = document.createElement('table'),
                tableBody = document.createElement('tbody'),
                thead = document.createElement('thead');


            //This will create the combo box for the filter
            var tableTitles = document.getElementById('tableTitles');

            //Remove all the options
            for(var k=tableTitles.options.length-1; k>=0; k--){
                tableTitles.remove(k);
            }

            //Setup the all option and prepare to add the remaining not hidden options
            var option = document.createElement("option");
            option.text = "ALL";
            option.value = "All";
            tableTitles.add(option);

            //Create the header for the table
            for ( var i = 0; i < data.headersOrder.length; i++ ){
                if ( controller.drillJSON(i)  === false ){

                    //Create the remaining options from the header array
                    option = document.createElement("option");
                    option.text = data.headerArray[data.headersOrder[i]].toUpperCase();
                    option.value = data.headerArray[data.headersOrder[i]];
                    tableTitles.add(option);

                    //Create a cell to put in the header for the column
                    var cell = document.createElement("th");
		    if (typeof cell.classList != 'undefined' ){
			cell.classList.add('header');
		    }

                    //Give the header cell the default sort order ... personnel will have no option to sort
                    if ( data.headersOrder.indexOf(data.headerArray.indexOf("personnel")) === i ){
                        cell.setAttribute('data-state', 'sortDisabled');
                    } else {
                        cell.setAttribute('data-state', 'sortNone');
                    }

                    //Set the cells to be draggable
                    cell.setAttribute('draggable','true');

                    //on drag start set the cell index to the event
                    cell.ondragstart = function(ev){
                        var idx = data.headerArray.indexOf(ev.target.textContent.toLowerCase());
                        ev.dataTransfer.setData("Text", idx);
                    };

                    //On drop get the event and use the dragged cell index and swap it with the one it landed on top of
                    cell.ondrop = function(ev){
                        ev.preventDefault();
                        var dropData = parseInt(ev.dataTransfer.getData("Text"));
                        var idx = data.headerArray.indexOf(ev.target.textContent.toLowerCase());

                        var a = data.headersOrder.indexOf(dropData);
                        var b = data.headersOrder.indexOf(idx);

                        //if dropped on top of self do nothing
                        if ( a !== b ){
                            /*else swap the columns todo add checkbox in modal option to allow swap or switch
                            var tmp = data.headersOrder[a];
                            data.headersOrder[a] = data.headersOrder[b];
                            data.headersOrder[b] = tmp;*/

                            var el = data.filteredTableHeader;
                            for ( var k = 0; k < el.length; k++ ){
                                //If disabled or the current one is active do not change
                                if ( el[k].getAttribute('data-state') === 'sortUp' || el[k].getAttribute('data-state') === 'sortDown'  ){
                                    data.sortArray.pre = data.headerArray.indexOf(el[k].textContent.toLowerCase());
                                }
                            }

                            //Insert column before the dropped location
                            if ( a > b ){
                                data.headersOrder.splice(b,0,data.headersOrder[a]);
                                data.headersOrder.splice(a+1,1);
                            } else {
                                data.headersOrder.splice(b+1,0,data.headersOrder[a]);
                                data.headersOrder.splice(a,1);
                            }

                            data.sortArray.inverse = !data.sortArray.inverse;

                            controller.initTable();
                        }
                    };

                    //Prevent default actions on drag over
                    cell.ondragover = function(ev){
                        ev.preventDefault();
                    };

                    //Append cell to header
                    thead.appendChild(cell).appendChild(document.createTextNode(data.headerArray[data.headersOrder[i]].toUpperCase()));
                }
            }

            //Add the header to the table
            table.appendChild(thead);

            //Build all the cell data
            for ( var key in jsonCollection){
                var row = document.createElement('tr');

                if ( jsonCollection.hasOwnProperty(key) ){
                    for ( var p = 0; p < data.headersOrder.length; p++ ){
                        if ( data.headersOrder[p] === 0 ){
                            controller.buildRowCells(row, 0, controller.createCell(jsonCollection[key].group));
                        } else if ( data.headersOrder[p] === 1 ){
                            controller.buildRowCells(row, 1, controller.createAnchorCell(jsonCollection[key].title, jsonCollection[key].wiki_link));
                        } else if ( data.headersOrder[p] === 2 ){
                            controller.buildRowCells(row, 2, controller.createCell(jsonCollection[key].no_of_discs));
                        } else if ( data.headersOrder[p] === 3 ){
                            controller.buildRowCells(row, 3, controller.createCell(jsonCollection[key].release_date));
                        } else if ( data.headersOrder[p] === 4 ){
                            controller.buildRowCells(row, 4, controller.createCell(jsonCollection[key].recording_date));
                        } else if ( data.headersOrder[p] === 5 ){
                            controller.buildRowCells(row, 5, controller.createCell(jsonCollection[key].personnel));
                        }
                    }

                }
                //Append cells to table body
                tableBody.appendChild(row);
            }

            //Add style to the table
	    if (typeof table.classList != 'undefined' ){
		table.classList.add('theme');
	    }

            //Give table an id
            table.setAttribute("id", "kingTable");

            //Append table body
            table.appendChild(tableBody);

            //Append table to panel
            document.querySelector('#tablePanel').appendChild(table);

            //Collect nodelist of table parts
            data.filteredTable = document.querySelectorAll("#kingTable tbody tr");
            data.filteredTableHeader = document.querySelectorAll("#kingTable .header");

            //Apply default sorting states when table is created
            for ( var j = 0; j < data.filteredTableHeader.length; j++ ){
                (function(num){
                    if ( data.filteredTableHeader[num].getAttribute('data-state') !== 'sortDisabled' ){

                        //Attach click events on sortable header cells
                        data.filteredTableHeader[num].onclick = function(){
                            //Sort the column
                            data.sortArray.inverse = controller.sortTableColumns(data.filteredTableHeader, num, data.sortArray.inverse );

                        }
                    }
                })(j);
            }
        },

        /*
         * Apply the sorting on the redraw when drag and drop or hide/unhide column
         */
        applySortRedraw: function(){

            var tmp = data.headersOrder.slice(0);
            for ( var key in data.headersHidden ){
                tmp.splice(data.headersHidden[key].index,1)
            }

            if ( data.sortArray.pre !== -1 ){
                data.sortArray.index = tmp.indexOf(data.sortArray.pre);
                data.sortArray.pre = -1;

                var el = data.filteredTableHeader;
                var tmpIdx = data.sortArray.index;

                //Sort the tables
                data.sortArray.inverse = controller.sortTableColumns(el, tmpIdx, data.sortArray.inverse);
            }
        },

        /*
         * Filter the table cells
         */
        filterAction: function (){
            var t = document.getElementById('tableTitles').value;
            var f = document.getElementById('filterInput').value;

            if (f.length > 0){
                var c = (t+' contains '+ f).toUpperCase(); //Text to go into the tag
                var aTag = document.createElement('a');
                var tr = document.getElementById('clearFiltersButton');

                //Apply the filter
                data.filteredTable = controller.applyFilter(f, data.filteredTable, t);
                //Store the filter
                data.filterObject[data.filterIndex] = {"filter":t , "value":f };

                //Create a tag to show as a filtered option
                aTag.setAttribute('href',"#");
                aTag.classList.add('tag');
                aTag.setAttribute('data-selid', data.filterIndex);
                aTag.textContent = c;

                aTag.onclick = function(){
                    //When clicking the tag it will remove the tag
                    delete data.filterObject[this.getAttribute('data-selid')];
                    this.parentNode.removeChild(this);

                    var count = 0;
                    //get count of all tags if none then hide the clear button
                    for ( var key in data.filterObject ){
                        count++;
                    }

                    if ( count < 1 ){
                        document.getElementById('clearFiltersButton').style.display = 'none';
                    }

                    //Build the table
                    controller.initTable();
                };

                document.getElementById('filterPanel').appendChild(aTag);
                document.getElementById('filterInput').value = '';

                //Find the tag display style property and swap it
                if (controller.findVisibility(tr)){
                    tr.style.display = '';
                }

                data.filterIndex++;
            }
        },

        /*
         * Find the visibility of an element then toggle it
         * @param el Element - check the display of element
         *
         * @return boolean of the new display style
         */
        findVisibility: function (el) {
            var style = window.getComputedStyle(el); //get the computed style

            //toggle the display style
            if (style.display === 'none') {
                return true;
            }
            return false;
        },

        /*
         * Setup the table with
         */
        initTable: function(){
            //Re build the table
            controller.createTable(data.albums_full);
            controller.applyFilterRedraw();
            controller.applySortRedraw();

            //Update the filter length
            document.getElementById('shownRecords').textContent = data.filteredTable.length;
        },


        /*
         * This will build the modal to manage the columns
         */
        buildModal: function (){
            for(var i=0;i<data.headerArray.length;i++){
                var container = document.createElement('div');
                var checkbox = document.createElement('input');
                var label = document.createElement('label');

                //Create the checkbox and push on the attributes
                checkbox.type = "checkbox";
                checkbox.name = "columnCheckbox";
                checkbox.value = i;
                checkbox.id = "columnCheckbox"+i;

                //If the checkbox is already clicked then check the box
                if ( data.headersHidden.hasOwnProperty(i) ){
                    checkbox.checked = "checked";
                }

                //Set up the label for the checkbox
                label.htmlFor = "columnCheckbox"+i;
                label.appendChild(document.createTextNode(data.headerArray[i].toUpperCase()));

                container.appendChild(checkbox);
                container.appendChild(label);

                //Wrap in scope and setup the on click functionality for the checkboxes
                (function(i){
                    checkbox.onclick = function(){  //var c = data.sortArray.index;
                        var idx = data.headersOrder.indexOf(i);
                        var count = 0;

                        //Get the count of the headers that are hidden
                        for ( var key in data.headersHidden ){
                            if ( key < i){
                                count++;
                            }
                        }

                        var el = data.filteredTableHeader;
                        for ( var k = 0; k < el.length; k++ ){
                            //If disabled or the current one is active do not change
                            if ( el[k].getAttribute('data-state') === 'sortUp' || el[k].getAttribute('data-state') === 'sortDown'  ){
                                data.sortArray.pre = data.headerArray.indexOf(el[k].textContent.toLowerCase());
                                data.sortArray.inverse = !data.sortArray.inverse;
                            }
                        }

                        //If the sort index click is same as the sort default on modal open just do simple hide and show
                        if ( data.sortArray.clone === idx ){
                            if ( data.headersHidden.hasOwnProperty(i) ){
                                delete data.headersHidden[i];
                            } else {
                                data.headersHidden[i] = {"index": idx};
                            }
                        } else {
                            //If the index is before the clicked option modify the sort array index reference to the new location
                            if ( data.headersHidden.hasOwnProperty(i) ){
                                delete data.headersHidden[i]; //remove from headers hidden

                                if ( data.sortArray.index+count >= i  ){
                                    data.sortArray.index++;
                                }
                            } else {
                                data.headersHidden[i] = {"index": idx}; //add to headers hidden

                                if ( data.sortArray.index >= i  ){
                                    data.sortArray.index--;
                                }
                            }
                        }

                        //re build the table properties
                        controller.initTable();

                    };
                })(i);

                //Append to the modal DOM
                document.getElementById('tableOptions').appendChild(container);

            }
        }

    };

    /*
     * MAIN FUNCTION - RUN ONCE ON LOAD
     */
    (function main(){

        /*
         * CSV Loader
         * jQuery deferred functionality to wait until loading is completed before processing is started.
         * this can also be achieved with nested ajax calls also but jQuery promises are very convenient
         */
        $.when(

            //Get all the CSV information and when completed run the then callback
            $.get(albumsCSV, function(csv) {
                data.albums = csv;
            }),

            $.get(albumsPersonnelCSV, function(csv) {
                data.albums_personnel = csv
            }),

            $.get(personnelCSV, function(csv) {
                data.personnel = csv;
            })

        ).then(function() {

            //Build JSON from all the CSV
            var tmpAlbums = controller.CSVtoJSON(data.albums);
            var tmpAlbumsPersonnel = controller.CSVtoRelationshipMatrix(data.albums_personnel);
            var tmpPersonnel = controller.CSVtoJSON(data.personnel);

            var count = 0;

            //Find the count of the albums after building the JSON
            for(var k in tmpAlbums) {
                if(tmpAlbums.hasOwnProperty(k)) {
                    count++;
                }
            }

            //Update the shown and loaded records number value
            document.getElementById('shownRecords').textContent = count;
            document.getElementById('totalRecords').textContent = count;

            //This builds all the mapping between the CSV files and returns a json
            data.albums_full = controller.buildRelationship(tmpAlbums,tmpAlbumsPersonnel,tmpPersonnel);

            //This will create the table and render it on the screen
            controller.createTable(data.albums_full);

            //This gets a reference to the table unfiltered
            data.filteredTable = document.querySelectorAll("#kingTable tbody tr");

            //On key up in the filtered input listen for enter key and submit action
            document.querySelector("#filterInput").onkeyup = function (e) {
                if (e.keyCode == 13) {
                    controller.filterAction();
                    document.getElementById('clearFiltersButton').style.display = "inline";
                }
            };

            //This will clear the filter
            document.getElementById('clearFiltersButton').onclick = function(){
                var tmp = document.querySelectorAll('#filterPanel a');

                //This will hide the clear filter button because none will exist
                document.getElementById('clearFiltersButton').style.display = 'none';

                //Remove all the DOM tags for the filters
                for ( var i = 0; i < tmp.length; i++ ){
                    tmp[i].parentNode.removeChild(tmp[i]);
                }

                //Remove all the JSON filter references
                for ( var key in data.filterObject ){
                    delete data.filterObject[key];
                }

                //Run the table init to build the dom tree
                controller.initTable();

            };

            //This will open the modal
            document.getElementById('openModalButton').onclick = function(){
                document.getElementById('openModal').classList.add('target');
                data.sortArray.clone = data.sortArray.index;
                controller.buildModal();
            };

            //This will close the modal via the close button the top right corner
            document.getElementById('closeModalButton').onclick = function(){
                document.getElementById('openModal').classList.remove('target');
                document.getElementById("tableOptions").innerHTML = "";
            };

            //This will apply the filter via apply button click
            document.getElementById('applyFilter').onclick = function(){
                controller.filterAction();
                document.getElementById('clearFiltersButton').style.display = "inline";
            };

        });
    })();
});