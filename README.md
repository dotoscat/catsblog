#catsblog#

A simple static blog generator made by a cat, for humans and cats.
This tool uses markdown and mustache for store information and rendering each one the pages.

Posts are automatically ordered by date (year-month-day) in a descedant order

##Usage##

catsblog init|create <site directory>
catsblog [-g | --generate] publish <site directory>
catsblog [-p | --publish] generate <site directory>
catsblog Show this help

-g --generate   Generate site
-p --publish    Publish the site
-h --help       Show this help

##Example##

`
catsblog init cutesite
cd cutesite
...works
`
