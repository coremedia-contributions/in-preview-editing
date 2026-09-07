import type { CSSProperties, FC } from "react";
import parse, { domToReact } from "html-react-parser";
import type { DOMNode, Element } from "html-react-parser";
import iconStyles from "../styles/components/Icon.module.css";

interface Props {
  svg: string;
  className?: string;
  size?: number;
}

const isSvgElement = (node: DOMNode): node is Element =>
  "name" in node && (node as Element).name === "svg";

const parseInlineStyle = (styleString?: string): CSSProperties | undefined => {
  if (!styleString) {
    return undefined;
  }

  const style: Record<string, string> = {};
  for (const declaration of styleString.split(";")) {
    const [rawProperty, ...rawValueParts] = declaration.split(":");
    const rawValue = rawValueParts.join(":");
    if (!rawProperty || !rawValue) {
      continue;
    }

    const camelCaseProperty = rawProperty
      .trim()
      .replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
    style[camelCaseProperty] = rawValue.trim();
  }

  return Object.keys(style).length > 0 ? (style as CSSProperties) : undefined;
};

const SVGIcon: FC<Props> = ({ svg, className = iconStyles.Icon, size = 22}) => {
  const svgElement = parse(svg, {
    replace(node) {
      if (isSvgElement(node as DOMNode)) {
        const element = node as Element;
        const existingClass = element.attribs.class ?? "";
        const mergedClass = [existingClass, className].filter(Boolean).join(" ");
        const { style, ...svgAttribs } = element.attribs;
        const inlineStyle = parseInlineStyle(style);
        return (
          <svg {...svgAttribs} className={mergedClass} style={inlineStyle} width={`${size}px`} height={`${size}px`}>
            {domToReact(element.children as DOMNode[])}
          </svg>
        );
      }
    },
  });
  return <>{svgElement}</>;
}

export default SVGIcon;
