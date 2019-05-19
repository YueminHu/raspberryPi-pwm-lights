import * as React from "react";

interface Props {
  children: () => Promise<any>;
}

export default class Loadable extends React.PureComponent<
  Props,
  {
    Component: any;
  }
> {
  constructor(props: Props) {
    super(props);
    this.state = { Component: null };
    props.children().then(Component =>
      this.setState({
        Component
      })
    );
  }
  render() {
    const { Component } = this.state;
    return Component ? <Component.default {...this.props} /> : <div>loading...</div>;
  }
}
