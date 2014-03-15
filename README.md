# Unobtrusive Google Maps

This JavaScript library aims to provide easy integration of Google Maps using progressive enhancement, without you having to write any JavaScript.

It does not have external dependencies except for the Google Maps v3 API. IE8 and newer are supported, but since the library is fairly new it hasn't been extensively tested across browsers (bug reports are welcome!).

Minified size: Around 3KB (1.5KB gzipped)



## How does it work?

The library replaces all `address.google-maps` elements with a Google Map. The contents of the address tag are used to query Google's [Geocoder API](https://developers.google.com/maps/documentation/geocoding/?hl=en), which provides the map coordinates for the text content. The result should be the same as when you enter the contents of the address tag into the Google Maps search field.



## Usage

1. Include `unobtrusive-gmaps.js` **at the end of your page**.
1. Add an `<address class="google-maps"></address>` tag anywhere on the site, containing the address you want to display on the map.
1. Make sure you have a height set for the `.rendered-google-maps` selector, otherwise your map will not show up since it'll have 0 height.



## Map Options

All [Map Options](https://developers.google.com/maps/documentation/javascript/reference?hl=de#MapOptions) supported by the Google Maps API that have a primitive type (string, boolean or number) as parameter can be set using `data-` attributes on the `address` element. The `map-type-id` is also supported, and accepts the lowercase variants of the [documented my types](https://developers.google.com/maps/documentation/javascript/reference?hl=de#MapTypeId). For example:

    <address class="google-maps"
        data-zoom="14"
        data-background-color="#ff00ff"
        data-map-type-id="satellite"
    >
        ...
    </address>

Note that capitalization for the Map Options must be replaced by dashed, e.g. `overviewMapControl` becomes `overview-map-control`.



## Possible Caveats

* If more than one result is returned from the Geocoder API, the first one is displayed (as returned by the API),



## License

    The MIT License (MIT)

    Copyright (c) 2014 Lucas Jenss

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

