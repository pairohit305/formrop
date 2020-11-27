import { useState, ChangeEvent } from "react";

export function useFormrop<S>(
  initState: S,
  /** if there is any empty value in init state and you want to fill it use this */
  fillStateifEmpty?: S
): [
  S,
  (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void,
  (key: Partial<S>) => void,
  (initWith?: Partial<S>) => void
] {
  const [value, setValue] = useState(() => {
    if (fillStateifEmpty) {
      const fillState = {};
      Object.entries(initState).forEach(([key, value]) => {
        if (!value.toString().length) {
          fillState[key] = fillStateifEmpty[key];
        } else {
          fillState[key] = value;
        }
      });

      return fillState as S;
    }
    return initState;
  });
  return [
    value,
    ({ target }: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): any => {
      const type = target.type;
      const key = target.name;
      let value: string | number | boolean = target.value || "";
      switch (type) {
        case "number":
          value = parseInt(value) || "";
          break;
        case "url":
          value = value.startsWith("http") ? value : "";
          break;
        case "checkbox":
          // @ts-ignore
          value = target.checked;
          break;
      }
      setValue((preState) => {
        if (key.includes(".")) {
          const [out, inner] = key.split(".");
          // @ts-ignore
          return { ...preState, [out]: { ...preState[out], [inner]: value } };
        }
        return { ...preState, [key]: value };
      });
    },
    (value) => {
      if (value) setValue((prevState) => ({ ...prevState, ...value }));
    },
    (initWith = {}) => {
      setValue({ ...initState, ...initWith });
    },
  ];
}
