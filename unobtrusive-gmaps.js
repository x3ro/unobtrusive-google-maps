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

            var addressValue = text(node);
            var result = _this.tryParseLatLong(addressValue);
            if(result.valid) {
                _this.renderMapWithCenter(node, result.latLong);
                return;
            }

            this.geocoder.geocode({'address': addressValue}, function(results, status) {
                if(status == google.maps.GeocoderStatus.OK) {
                    _this.renderMapWithGeocoderResult(node, results);
                } else {
                    console.error('Geocode of "' + addressValue + '" was not successful for the following reason: ' + status);
                }
            });
        },

        // Replaces the given node with a map displaying the result found by the
        // Geocoding API.
        renderMapWithGeocoderResult: function(node, geocoderResults) {
            var result = geocoderResults[0];
            this.renderMapWithCenter(node, result.geometry.location);
        },

        // Renders a Google Map, replacing the given `node`. `latLong` must be
        // of type `google.maps.LatLng` and indicates the desired map center.
        renderMapWithCenter: function(node, latLong) {
            var container = document.createElement("div");
            container.className = 'rendered-google-maps';
            node.parentNode.replaceChild(container, node);

            var mapOptions = this.stringToMapOptionsType(
                this.dataAttributesFromNode(node));
            mapOptions['center'] = latLong;

            // Default value for zoom because the Map will appear broken if no zoom is
            // provided.
            if(typeof(mapOptions['zoom']) === 'undefined') {
                mapOptions['zoom'] = 10;
            }

            var container = this.replaceWithMapContainer(node);
            var map = new google.maps.Map(container, mapOptions);
            var marker = new google.maps.Marker({
                map: map,
                position: latLong
            });

            this.handleCustomMapOptions(node, map, mapOptions);
        },

        // Handles map options provided by his library and not by Google Maps.
        handleCustomMapOptions: function(node, map, options) {
            if(options['linkToMap']) {
                google.maps.event.addDomListener(map.getDiv(), 'click', function(e) {
                    window.open(map.mapUrl + '&q=' + encodeURIComponent(text(node)), '_blank');
                    e.preventDefault();
                    e.stopPropagation();
                });
            }
        },

        // Replaces the given node with a div container which is to contain the rendered map.
        replaceWithMapContainer: function(node) {
            var container = document.createElement("div");
            container.className = 'rendered-google-maps';
            node.parentNode.replaceChild(container, node);
            return container;
        },

        // Given arbitrary text, determines whether or not it represents a
        // "Latitude Longitude" value pair.
        // Returns an object with a key `valid` indicating whether or not a
        // latLong value was found, and the corresponding location as an object
        // of type `google.maps.LatLng`.
        tryParseLatLong: function(text) {
            var values = text.split(',');
            if(values.length == 2) {
                var lat = parseFloat(values[0]);
                var lng = parseFloat(values[1]);

                if(!isNaN(lat) && !isNaN(lng)) {
                    return {valid: true, latLong: new google.maps.LatLng(lat, lng)};
                }
            }

            return {valid: false, latLong: null};
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
                    case "link-to-map": // This is a custom option, not a Maps API option
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
        var text;
        if(typeof(node.textContent) === 'undefined') {
            text = node.innerText; // IE < 9
        } else {
            text = node.textContent;
        }
        return text.replace(/(\n|\s\s+)/g, ' ')
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
