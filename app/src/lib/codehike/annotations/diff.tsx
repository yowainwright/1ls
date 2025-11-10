import type { AnnotationHandler } from "codehike/code"
import { ANNOTATION_CLASSES } from "../constants"

export const diff: AnnotationHandler = {
  name: "diff",
  Line: ({ annotation, ...props }) => {
    const type = annotation?.query
    const className = type === "+"
      ? ANNOTATION_CLASSES.diffAdd
      : type === "-"
      ? ANNOTATION_CLASSES.diffRemove
      : ""

    return <div className={className} {...props} />
  },
}
