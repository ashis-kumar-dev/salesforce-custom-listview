# Custom List View

Custom list view using the power of apex and lightning web components.

## What problems it solves ?

-   There are limitations, which objects can be used in the lightning listview base component
-   Not only the solution supports normal objects, also the setup objects
-   Privacy restricting browsers do not work properly when you open setup page, as it requires to transfer cookies to different domains
    (Setup page serves data from the visualforce domain as well, so if you block cross domain cookie sharing, you break setup. It forces to switch to classic. And I don't want to go into classic view.)

## What can you do with this ?

-   Select any object, and see all records from that object
-   Search through the list

## Features (if not marked, it is not yet available)

-   [x] Support for setup objects
-   [x] Infinte loading
-   [x] Search through the result
-   [x] Select fields to be displayed on the go
-   [ ] Sorting
-   [ ] Add filters
-   [ ] Shareable listview link (anyone in the org can see the list view you configured)
