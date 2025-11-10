import type { AnnotationHandler } from "codehike/code"
import { ANNOTATION_CLASSES } from "../constants"

export const focus: AnnotationHandler = {
  name: "focus",
  Line: ({ annotation, ...props }) => {
    return (
      <div
        className={annotation ? ANNOTATION_CLASSES.focus : ANNOTATION_CLASSES.unfocus}
        {...props}
      />
    )
  },
}
