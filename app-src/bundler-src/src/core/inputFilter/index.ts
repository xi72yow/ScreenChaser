export function setInputFilter({
  textInput,
  inputFilter,
  validationCallback,
}: {
  textInput: HTMLInputElement;
  inputFilter: (value: string | null) => boolean;
  validationCallback: (isValid: boolean) => void;
}): void {
  textInput.addEventListener("beforeinput", (e) => {
    if (!inputFilter(e.data)) {
      e.preventDefault();
      validationCallback(false);
    } else {
      validationCallback(true);
    }
  });
}
