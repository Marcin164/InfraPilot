import React from "react";
import { PropagateLoader } from "react-spinners";

type Props = {};

const SignInLoader = (props: Props) => {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <PropagateLoader color="#2B9AE9" size={60} aria-label="Loading Spinner" />
    </div>
  );
};

export default SignInLoader;
