import type { AnnotationHandler } from "codehike/code"
import { COMPONENT_CLASSES } from "../constants"

export const lineNumbers: AnnotationHandler = {
  name: "line-numbers",
  Line: ({ annotation, ...props }) => {
    const lineNumber = props.lineNumber
    return (
      <div className="flex">
        <span className={COMPONENT_CLASSES.lineNumbers}>
          {lineNumber}
        </span>
        <div {...props} />
      </div>
    )
  },
}
