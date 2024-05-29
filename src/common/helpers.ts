export const _extractBlockFormValues = (submittedValues: any) => {
  const structuredValues: any = {};
  const blockIdMapping: any = {};

  Object.values(submittedValues).forEach((inputField) => {
    const field = Object.keys(inputField)[0];
    const fieldValue = Object.values(inputField)[0];
    const value =
      fieldValue.value ??
      fieldValue.selected_users ??
      fieldValue.selected_user ??
      fieldValue.selected_option?.value ??
      null;

    structuredValues[field] = value;
  });

  Object.keys(submittedValues).forEach((key) => {
    const field = Object.keys(submittedValues[key])[0];

    blockIdMapping[field] = key;
  });

  return {
    structuredValues,
    blockIdMapping,
  };
};
