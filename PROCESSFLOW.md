# Process Flow

Here is an overview of the process flow of custom list view.

-   When user opens the list view
    -   list view loads a default object's list view, with some default preselected fields
-   When user clicks to change the object
    -   User will see a configuration page
        -   with already selected object
        -   with already selected fields
    -   When user tries to change the object
        -   all objects are listed with their api names and label
        -   user will be able to type the name to search through
    -   When user selects one object from the list
        -   available fields loads
        -   selected fields has the name fields defaulted
        -   User can add as many fields as needed
    -   When user saves the selection
        -   list view loads records from the selected object
        -   list view has the selected columns
