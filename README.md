# Lani
*Turn your website into a web application with one*
*simple-to-use JavaScript plugin library*

See [the GitHub Pages site](https://algorythm-dylan.github.io/Lani/) for demos and docs

## Quickstart

Ensure FontAwesome (version 6 or compatible) is available
on your site. Copy the files from the `build` directory
of this repository to your static resources under a folder
called "lani" (or change `Lani.contentRoot`). Then, include
these files on every page you want to use Lani (you don't
need to do anything with `templates.html`)

## Focus
Lani is focused on a great experience for developers and
end users. Lani elements aim to be as declarative as
possible, and font-end devs should not need to use any
JavaScript to configure Lani elements.

```html
<lani-table>
    <!-- Set the title of the table to an HTML template -->
    <template id="title">
        <h2>Profit - Past 10 years by department</h2>
    </template>

    <!--
        Set the data source of this table to download
        the JSON API response once into memory
    -->
    <lani-data-source download="/api/report/profit-10-year"></lani-data-source>
</lani-table>
```

## FontAwesome / Icons

By default, Lani uses FontAwesome for icons. FontAwesome
doesn't need to be installed in any special way. Lani
was built with FontAwesome 6.

If you use anything other than the free version, you
can even set the `Lani.iconResolver.defaultStyle` to
something like `"fa-regular"`. Note that `defaultStyle`
is only available for `Lani.FontAwesomeIconResolver`.

You can use your own icon library if you want, you just need
to write your own `Lani.IconResolver` and then set
`Lani.iconResolver` to an instance of your new resolver.