import * as React from "react";
// import {
//   DropDownListComponent,
//   MultiSelect
// } from "@syncfusion/ej2-react-dropdowns";

import { MultiSelectComponent } from "@syncfusion/ej2-react-dropdowns";

import { getComponent } from "@syncfusion/ej2-base";
export default function SelectTemplate(props) {
  let options = props.options;

  //   const options = props.options;
  let qryBldrObj;
  let state = Object.assign({}, props);
  qryBldrObj = getComponent(
    document.getElementById("querybuilder"),
    "query-builder"
  );
  const args = state;
  function onChange(event) {
    const args = state;
    let elem = document
      .getElementById(args.ruleID)
      .querySelector(".e-rule-value");
    qryBldrObj.notifyChange(event.value, elem, "value");
  }
  return (
    <div>
      <MultiSelectComponent
        id="mtselement"
        dataSource={options}
        value={args.rule.value}
        change={onChange}
        //   fields={fields}
      />
    </div>
  );
}
