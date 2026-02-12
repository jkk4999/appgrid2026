import * as React from 'react';
import { MultiSelectComponent } from '@syncfusion/ej2-react-dropdowns';
import { getComponent } from '@syncfusion/ej2-base';
import { QueryBuilderComponent } from '@syncfusion/ej2-react-querybuilder';
import { ActionEventArgs } from '@syncfusion/ej2-querybuilder';

export default function SelectTemplate(props: any) {
   const options = props.options;

   let qryBldrObj: QueryBuilderComponent | null = null;

   // Initialize QueryBuilder object
   const queryBuilderElement = document.getElementById('advancedFilterBuilder');

   if (queryBuilderElement) {
      qryBldrObj = getComponent(queryBuilderElement, 'query-builder') as QueryBuilderComponent;
   } else {
      console.error("The element with ID 'advancedFilterBuilder' was not found.");
   }

   const state = Object.assign({}, props);
   const args: ActionEventArgs = state;

   function onValueChange(event: any): void {
      if (!qryBldrObj) {
         console.error("QueryBuilder object is not initialized.");
         return;
      }

      const ruleElement = document.getElementById(args.ruleID);
      if (ruleElement) {
         const elem = ruleElement.querySelector('.e-rule-value') as HTMLElement | null;
         if (elem) {
            qryBldrObj.notifyChange(event.value as string[], elem, 'value');
         } else {
            console.error("Rule element does not contain '.e-rule-value'.");
         }
      } else {
         console.error(`The element with ID '${args.ruleID}' was not found.`);
      }
   }

   return (
      <div>
         <MultiSelectComponent
            dataSource={options}
            fields={{ text: 'label', value: 'name' }} // Configure fields for display and value
            value={args.rule?.value as string[]}
            change={onValueChange}
         />
      </div>
   );
}