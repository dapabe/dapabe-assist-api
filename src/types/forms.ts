/**
 *  When state comes from outside the component
 */
export type IFormProps<FormSchema> = {
  values: FormSchema;
  /** Wheter outside values are being loaded */
  isLoading?: boolean | Record<keyof FormSchema, boolean>;
  /** Wether has loaded with errors */
  loadErrors?: Record<keyof FormSchema, string | undefined>;
};
