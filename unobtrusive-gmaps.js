/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Lucas Jenss
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


;(function() {

    function UnobtrusiveGmaps(selector) {
        var _this = this;

        // If there are no maps, bail out
        this.elements = document.querySelectorAll(selector);
        if(this.elements.length < 1) {
            return;
        }

        window.UnobtrusiveGmapsCallback = function() {
            _this.initialize();
            _this.mapifyAll();
        }
        this.loadAPI('UnobtrusiveGmapsCallback');
    }

    UnobtrusiveGmaps.prototype = {

        // Asynchronously loads the Google Maps API and then fires the given callback. The
        // callback must be provided as a string referencing a top-level function (i.e.
        // accessible throught the |window| property).
        loadAPI: function(callbackName) {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&' +
                'callback=' + callbackName;
            document.body.appendChild(script);
        },

        // Initializes API related instance variables after the API is loaded.
        initialize: function() {
            this.geocoder = new google.maps.Geocoder();
        },

        // Creates the Google Maps for all relevant DOM Nodes.
        mapifyAll: function() {
            for(var i=0; i<this.elements.length; i++) {
                this.mapify(this.elements[i]);
            }
        },

        // Creates the Google Map for the given DOM Node.
        mapify: function(node) {
            var _this = this;

            this.geocoder.geocode({'address': text(node)}, function(results, status) {
                if(status == google.maps.GeocoderStatus.OK) {
                    _this.renderMap(node, results);
                } else {
                    console.error('Geocode of "' + text(node) + '" was not successful for the following reason: ' + status);
                }
            });
        },

        // Replaces the given node with a map displaying the result found by the
        // Geocoding API.
        renderMap: function(node, geocoderResults) {
            var mapOptions = this.stringsToMapOptionsTypes(
                this.dataAttributesFromNode(node));

            var result = geocoderResults[0];
            mapOptions['center'] = result.geometry.location;

            // Default value for zoom because the Map will appear broken if no zoom is
            // provided.
            if(typeof(mapOptions['zoom']) === 'undefined') {
                mapOptions['zoom'] = 10;
            }

            var container = this.replaceWithMapContainer(node);
            var map = new google.maps.Map(container, mapOptions);
            new google.maps.Marker({
                map: map,
                position: result.geometry.location
            });
        },

        // Replaces the given node with a div container which is to contain the rendered map.
        replaceWithMapContainer: function(node) {
            var container = document.createElement("div");
            container.className = 'rendered-google-maps';
            node.parentNode.replaceChild(container, node);
            return container;
        },

        // Extracts all "data-*" attributes from the given node, and returns an object
        // mapping attribute names (with the prepending data-) removed to values.
        dataAttributesFromNode: function(node) {
            var result = {};

            for(var i=0; i < node.attributes.length; i++) {
                var attr = node.attributes[i];
                var matches = /^data-(.+)$/.exec(attr.name);
                if(matches !== null) {
                    result[matches[1]] = attr.value;
                }
            }

            return result;
        },

        // Since HTML attributes can only contain strings, we need to map each option's
        // value to the correct type, or the API will complain.
        stringsToMapOptionsTypes: function(options) {
            var result = {};

            for(var opt in options) {
                switch(opt) {
                    // String options
                    case "background-color":
                    case "draggable-cursor":
                    case "dragging-cursor":
                    case "map-type-id":
                        result[dashedToCapitalized(opt)] = options[opt];
                        break;

                    // Special case because the option is called "disableDefaultUI",
                    // which would translate to "disable-default-u-i". Since that is ugly,
                    // we have to handle it manually.
                    case "disable-default-ui":
                        result["disableDefaultUI"] = options[opt];
                        break;

                    // Boolean options
                    case "disable-double-click-zoom":
                    case "draggable":
                    case "keyboard-shortcuts":
                    case "map-maker":
                    case "map-type-control":
                    case "no-clear":
                    case "overview-map-control":
                    case "pan-control":
                    case "rotate-control":
                    case "scale-control":
                    case "scrollwheel":
                    case "street-view-control":
                    case "zoom-control":
                        result[dashedToCapitalized(opt)] = /^[ ]*true[ ]*$/i.test(options[opt]);
                        break;


                    // Number-type options
                    case "heading":
                    case "max-zoom":
                    case "min-zoom":
                    case "tilt":
                    case "zoom":
                        result[dashedToCapitalized(opt)] = parseFloat(options[opt]);
                        break;

                    // Unsupported options
                    case "center":
                    case "map-type-control-options":
                    case "overview-map-control-options":
                    case "pan-control-options":
                    case "rotate-control-options":
                    case "scale-control-options":
                    case "street-view":
                    case "street-view-control-options":
                    case "styles":
                    case "zoom-control-options":
                        console.error("The MapOption '" + opt + "' is not supported by Unobtrusive Google Maps (yet).");
                        break;

                    default:
                        console.error("Unobtrusive Google Maps: Unknown option '" + opt + "'.");
                }
            }

            return result;
        }
    }

    new UnobtrusiveGmaps('address.google-maps');



    /* =================
     * Utility functions
     * ================= */

    // Returns a textual representation of the given node's contents,
    // i.e. stripped of all HTML
    function text(node) {
        if(typeof(node.textContent) === 'undefined') {
            return node.innerText; // IE < 9
        } else {
            return node.textContent;
        }
    }

    // Convert a string of the 'dashed' form "this-is-awesome" to the capitalized
    // form "thisIsAwesome".
    function dashedToCapitalized(str) {
        var result = '';
        str += ' '; // Add a space at the end to avoid boundary checks in loop

        for(var i=0; i < (str.length-1); i++) {
            if(str[i] !== '-') {
                result += str[i];
                continue;
            }

            i++;
            result += str[i].toUpperCase();
        }

        return result;
    }
})();
