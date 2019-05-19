import * as React from "react";
import Home from "./home";
import Loadable from "components/loadable";

export default (props: Home["props"]) => <Loadable {...props}>{() => import("./home")}</Loadable>;
