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

Please refer to the changelog for the most up-to-date information
regarding this issue.

## Development and this repository

Right now, Lani isn't looking for any collaborators.
It's a passion project and adding any sort of
responsibility to it would be detrimental to my
experience.

There's a custom build system because I couldn't find a
simple command that would just concatenate JS/CSS/etc files.
By default they aren't minified. Maybe I'll release
minified versions with actual "release" packages, but for
now, you'll need to deal with the extra bytes.

Plus, the `concat.js` file is really simple stuff. It's
not ***too*** far off something line a webpack js
config file.

In VSCode you can just press `ctrl + shift + b` to build
and copy the files to the various locations they need to go.
The process isn't automatic. If you make changes, you need
to build. Also, files aren't automatically added to the build.
You need to add them into `concat.js`. For some reason
it doesn't work on Linux. You need to manually run
`node concat.js` from the root directory.

The `playground` folder is a simple place for putting
together unfinished demos. It's like a slightly more
permanent version of a test page, but still not permanent.

The `build` folder is just a simple output of the build
process.

The `docs` folder should be a polished documentation and
examples site. It will also include "marketing" and act as
the landing page of the library, not just docs.

There are some npm scripts for building the project and
also starting local web servers (expressjs dependency).
By default they run on port 1234.