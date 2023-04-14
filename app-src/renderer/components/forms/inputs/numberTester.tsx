import {
  rankWith,
  schemaTypeIs,
} from "@jsonforms/core";

export default rankWith(5, schemaTypeIs("integer"));
