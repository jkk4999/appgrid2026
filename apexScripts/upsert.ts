const jsonStr = '{
   "globalEntities": {
       "availableColumns": {
           "id": {
               "field": "id",
               "dataType": "number"
           },
           "name": {
               "field": "name",
               "label": "Name",
               "width": 100,
               "dataType": "text"
           },
           "language": {
               "field": "language",
               "label": "Language",
               "width": 100,
               "dataType": "text"
           },
           "license": {
               "field": "license",
               "label": "License",
               "width": 130,
               "dataType": "text"
           },
           "github_stars": {
               "field": "github_stars",
               "label": "Stars",
               "width": 100,
               "editable": true,
               "dataType": "number"
           },
           "homepage": {
               "field": "homepage",
               "label": "Homepage",
               "dataType": "text"
           }
       }
   },
   "view": {
       "currentViewId": "tableView",
       "views": [
           {
               "id": "tableView",
               "label": "Table View",
               "columnDefaultWidth": 200,
               "columns": [
                   {
                       "id": "name"
                   },
                   {
                       "id": "language"
                   },
                   {
                       "id": "license"
                   },
                   {
                       "id": "github_stars"
                   },
                   {
                       "id": "homepage"
                   }
               ]
           },
           {
               "id": "groupedView",
               "label": "Grouped View",
               "columns": [
                   {
                       "id": "language-group",
                       "groupBy": "language"
                   },
                   {
                       "id": "name"
                   },
                   {
                       "id": "license"
                   },
                   {
                       "id": "github_stars"
                   },
                   {
                       "id": "homepage"
                   }
               ]
           }
       ]
   },
   "dashboard": {
       "top": {
           "widgets": [
               {
                   "id": "view",
                   "type": "view"
               }
           ]
       }
   },
   "grid": {
       "rowHeight": 30,
       "columnHeaderHeight": 30,
       "renderColumnMenuIcon": "hover"
   },
   "alert": {
       "alerts": {},
       "defaultHighlightDuration": 600
   },
   "customSort": {},
   "styledCell": {},
   "theme": "auto",
   "quickSearch": {
       "highlightTextStyle": {
           "background": "#fbefaa",
           "color": "#000"
       },
       "activeCellStyle": {
           "background": "#fbefaa",
           "color": "#000"
       },
       "quickSearchDebounceTime": 250,
       "disableNavigation": false
   },
   "config": {
       "applicationName": "AdapTable For Infinite Demo",
       "colorPallete": [
           "var(--adaptable-color-accent)",
           "#000000",
           "#FFFFFF",
           "#D3D3D3",
           "#808080",
           "#A52A2A",
           "#006400",
           "#008000",
           "#32CD32",
           "#FFFF00",
           "#FFFFE0",
           "#00008B",
           "#0000FF",
           "#87CEFA",
           "#00FFFF",
           "#FF00FF",
           "#800080",
           "#8B0000",
           "#FF0000",
           "#FFC0CB",
           "#FFA500"
       ]
   },
   "flashingCell": {
       "defaultFlashingStyle": {
           "upChangeStyle": {
               "background": "var(--adaptable-color-success)"
           },
           "downChangeStyle": {
               "background": "var(--adaptable-color-error)"
           },
           "neutralChangeStyle": {
               "background": "var(--adaptable-color-info)"
           }
       }
   },
   "export": {
       "reports": {
           "Current Data": {
               "label": "Current Data",
               "columnScope": "VisibleColumns",
               "rowScope": "VisibleRows"
           },
           "All Data": {
               "label": "All Data",
               "columnScope": "AllColumns",
               "rowScope": "AllRows"
           },
           "Selected Cells": {
               "label": "Selected Cells",
               "columnScope": "SelectedCellColumns",
               "rowScope": "SelectedCellRows"
           }
       }
   }
}';
   
map<string, object> newRecObj = new map<string, object>();
newRecObj.put('GridState__c', jsonStr);
newRecObj.put('Id', 'a05Hs00001F67Z2IAJ');
newRecObj.put('IsDetailState__c', false);

system.debug('newRecObj is ' + newRecObj);

List<object> jsonRec = new List<object>();
jsonRec.add(newRecObj);

string jsonRecs = JSON.serialize(jsonRec);

system.debug('jsonRecs is ' + jsonRecs);

AgWrapperUpsertResult result = AppGridController.upsertRecs2('Account', jsonRecs);
system.debug(result);
