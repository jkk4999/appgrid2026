import { useCallback } from "react";

// Redux
// import { useSelector, useDispatch } from 'react-redux'

// Html Encode/Decode
import { decode } from "he";

// Lodash
import * as _ from "lodash-es";

// Axios
import axios from "axios";

// functions
import { lccPromise } from "./lccPromise";

// ENVIRONMENT
const env = import.meta.env.VITE_REACT_APP_ENV;

// takes a string instead of SelectedObject for arg

async function layoutOptionsService(objState: any) {
  // create the layout options
  const layoutOptions: any[] = [];

  objState.state.Layout.Layouts.forEach((l: any) => {
    layoutOptions.push(l);
  });

  return layoutOptions;
}

export default layoutOptionsService;
