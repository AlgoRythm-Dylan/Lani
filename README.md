# Lani
*Turn your website into a web application with one*
*simple-to-use JavaScript plugin library*

The easiest way to get going is to just create a folder
on the root of your site called "lani" and put the files
from the `build` folder of this repository in there.
Finally, ensure FontAwesome is available on your site.
See the notes below about FontAwesome / icons.

Then, just link `lani.js` and/or `lani.css` in your pages.

The CSS and JS libraries do not depend on each other - 
you can choose to exclusively use one or the other. The
`templates.html` file is loaded automatically but the JS
library.

See [the GitHub Pages site](https://algorythm-dylan.github.io/Lani/) for demos and docs

## FontAwesome / Icons

Lani alpha has a hard dependency on FontAwesome. There is
no icon resolution service in Lani - everything is hard-coded.

This will change well before release of Lani 1. But for now,
it's the way things are. Lani depends on FontAwesome version 6.