"use client";

import { useMemo } from "react";
import * as runtime from "react/jsx-runtime";

interface MDXContentProps {
  code: string;
}

const useMDXComponent = (code: string) => {
  return useMemo(() => {
    const fn = new Function(code);
    return fn({ ...runtime }).default;
  }, [code]);
};

export function MDXContent({ code }: MDXContentProps) {
  const Component = useMDXComponent(code);
  return <Component />;
}
