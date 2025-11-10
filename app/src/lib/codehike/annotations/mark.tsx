import type { AnnotationHandler } from "codehike/code"
import { ANNOTATION_CLASSES } from "../constants"

export const mark: AnnotationHandler = {
  name: "mark",
  Line: ({ annotation, ...props }) => {
    return (
      <div className={annotation ? ANNOTATION_CLASSES.mark : ""} {...props} />
    )
  },
}
