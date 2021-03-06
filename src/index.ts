import React, { ChangeEvent, useMemo, useState } from "react";

const formRopStore = {};

type Modifier<V> = (value: V) => V;
type FromTimestamp<V> = (value: number) => V;
type ToDate<V> = (value: V) => string;
export function useFormrop<S>(initState: S | (() => S)): [
  S,
  (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void,
  (key: Partial<S>) => void,
  (initWith?: Partial<S>, merge?: boolean) => void,
  {
    Input: <N extends keyof S, V>(props: {
      type: "url" | "text" | "number";
      name: N;
      deep?: keyof NonNullable<S[N]>;
      value: V;
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
      modifier?: Modifier<V>;
      disabled?: boolean | undefined;
      className?: string;
      id?: string;
      style?: React.CSSProperties;
      autoFocus?: boolean;
      placeholder?: string;
    }) => React.DetailedReactHTMLElement<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >;
    Date: <N extends keyof S, V>(props: {
      name: N;
      deep?: keyof NonNullable<S[N]>;
      value: V;
      toDate: ToDate<V>;
      FromTimestamp: FromTimestamp<V>;
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
      disabled?: boolean | undefined;
      readOnly?: boolean | undefined;
      className?: string;
      id?: string;
      style?: React.CSSProperties;
      autoFocus?: boolean;
    }) => React.DetailedReactHTMLElement<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >;
    DateTime: <N extends keyof S, V>(props: {
      name: N;
      deep?: keyof NonNullable<S[N]>;
      value: V;
      toDate: ToDate<V>;
      FromTimestamp: FromTimestamp<V>;
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
      disabled?: boolean | undefined;
      readOnly?: boolean | undefined;
      className?: string;
      id?: string;
      style?: React.CSSProperties;
      autoFocus?: boolean;
    }) => React.DetailedReactHTMLElement<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >;
    TextArea: <N extends keyof S>(props: {
      name: N;
      deep?: keyof NonNullable<S[N]>;
      value: string;
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
      disabled?: boolean;
      className?: string;
      id?: string;
      style?: React.CSSProperties;
      autoFocus?: boolean;
      placeholder?: string;
    }) => React.DetailedReactHTMLElement<
      React.InputHTMLAttributes<HTMLTextAreaElement>,
      HTMLTextAreaElement
    >;
    CheckBox: <N extends keyof S>(props: {
      label: string;
      name: N;
      deep?: keyof NonNullable<S[N]>;
      value: boolean;
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
      className?: string;
      style?: React.CSSProperties;
    }) => React.DetailedReactHTMLElement<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >;
    Selection: <N extends keyof S, V>(props: {
      name: N;
      deep?: keyof NonNullable<S[N]>;
      value: V;
      /** {
       *    value1: label1,
       *    value2: label2,
       *    WW: 'World Wide',
       *    IN: 'India',
       *    0: 'Don't include',
       *    1: 'Yes, i am in',
       *    ....
       * }
       * */
      // @ts-ignore
      data: { [Data in V]: string | number };
      onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
      className?: string;
      id?: string;
      style?: React.CSSProperties;
    }) => React.DetailedReactHTMLElement<
      React.SelectHTMLAttributes<HTMLSelectElement>,
      HTMLSelectElement
    >;
    Submit: (props: {
      onSubmit: Function;
      disabled?: boolean;
      children?: string;
      className?: string;
      id?: string;
      style?: React.CSSProperties;
    }) => React.DetailedReactHTMLElement<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >;
  }
] {
  /** Html Inputs design */
  const [value, setValue] = useState(initState);
  return [
    value,
    ({
      target,
    }: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >): any => {
      const type = target.type;
      const name = target.name;
      const deep = target.dataset.deep;

      let value: string | number | boolean | Date = target.value || "";
      switch (type) {
        case "text":
        case "textarea":
          value = value.length > 0 ? value : ((target.value = ""), null as any);
          break;
        case "number":
          value = parseInt(value) || ((target.value = ""), null as any);
          break;
        case "url":
          value = value.startsWith("http")
            ? value
            : ((target.value = ""), null as any);
          break;
        case "checkbox":
          // @ts-ignore
          value = target.checked;
          break;
        case "date":
        case "datetime-local":
          // @ts-ignore
          value = target.valueAsNumber;
          break;
      }

      // check for modifier
      if (target.dataset.modifier === "true") {
        const key = name + "" + deep;
        const modifier = formRopStore[key] as Modifier<typeof value>;
        value = modifier(value);
      }

      // for date modifier
      if (target.type === "datetime-local" || target.type === "date") {
        const key = name + "" + deep;
        const FromTimestamp = formRopStore[key] as any;
        value = FromTimestamp(value as number);
      }

      setValue((preState) => {
        if (deep)
          return { ...preState, [name]: { ...preState[name], [deep]: value } };

        return { ...preState, [name]: value };
      });
    },
    (value) => {
      if (value) setValue((prevState) => ({ ...prevState, ...value }));
    },
    (initWith = {}, merge) => {
      if (!merge) {
        // @ts-ignore
        setValue(initWith);
      } else {
        if (typeof initState === "function") {
          // @ts-ignore
          setValue({ ...initState(), ...initWith });
        } else {
          setValue({ ...initState, ...initWith });
        }
      }
    },
    // components
    useMemo(
      () => ({
        Input: ({ deep, modifier, placeholder, type, ...props }) => {
          if (modifier) {
            const key = props.name + "" + deep;
            formRopStore[key] = modifier;
          }

          if (type === "url" && !placeholder) {
            placeholder = "https://";
          }

          return React.createElement("input", {
            type,
            placeholder,
            ...props,
            autoComplete: "off",
            autoCorrect: "off",
            autoCapitalize: "off",
            spellCheck: "false",
            // this is hack just to pass function or anything in native input!!
            ["data-modifier"]: !!modifier,
            ["data-deep"]: deep,
          }) as any;
        },
        Date: ({ deep, value, FromTimestamp, toDate, ...props }) => {
          const key = props.name + "" + deep;
          formRopStore[key] = FromTimestamp;
          return React.createElement("input", {
            ...props,
            type: "date",
            value: toDate(value),
            ["data-deep"]: deep,
          }) as any;
        },
        DateTime: ({ deep, value, FromTimestamp, toDate, ...props }) => {
          const key = props.name + "" + deep;
          formRopStore[key] = FromTimestamp;
          return React.createElement("input", {
            ...props,
            type: "datetime-local",
            value: toDate(value),
            ["data-deep"]: deep,
          }) as any;
        },
        TextArea: ({ deep, ...props }) =>
          React.createElement("textarea", {
            ...props,
            autoComplete: "off",
            autoCorrect: "off",
            autoCapitalize: "off",
            spellCheck: "false",
            ["data-deep"]: deep,
          }) as any,
        CheckBox: ({ deep, value, label, ...props }) =>
          React.createElement(React.Fragment, {
            children: [
              React.createElement("input", {
                ...props,
                ["data-deep"]: deep,
                id: props.name + "" + deep,
                type: "checkbox",
                checked: value,
                key: props.name + "" + deep + "input",
              }),
              React.createElement("label", {
                htmlFor: props.name + "" + deep,
                children: label,
                key: props.name + "" + deep + "label",
              }),
            ],
          }) as any,
        Selection: ({ deep, data, ...props }) => {
          return React.createElement(
            "select",
            {
              ...props,
              ["data-deep"]: deep,
            },
            Object.entries(data).map(([value, label]) => {
              return React.createElement(
                "option",
                {
                  key: value,
                  value: value,
                },
                label as string
              );
            })
          ) as any;
        },
        Submit: ({ onSubmit, ...props }) =>
          React.createElement("button", {
            ...props,
            type: "button",
            onClick: () => onSubmit(),
          }),
      }),
      []
    ),
  ];
}

export function useFormropArrays<S>(initState: S[]): [
  S[],
  (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void,
  (value: S[]) => void,
  (initWith?: S[]) => void,
  {
    Input: <V>(props: {
      type: "url" | "text" | "number";
      value: V;
      modifier?: Modifier<V>;
      name: string;
      deep?: string;
      index: number;
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
      disabled?: boolean | undefined;
      className?: string;
      id?: string;
      style?: React.CSSProperties;
      autoFocus?: boolean;
      placeholder?: string;
    }) => React.DetailedReactHTMLElement<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >;
    Date: <V>(props: {
      name: string;
      deep?: string;
      value: V;
      index: number;
      toDate: ToDate<V>;
      FromTimestamp: FromTimestamp<V>;
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
      disabled?: boolean | undefined;
      readOnly?: boolean | undefined;
      className?: string;
      id?: string;
      style?: React.CSSProperties;
      autoFocus?: boolean;
    }) => React.DetailedReactHTMLElement<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >;
    DateTime: <V>(props: {
      name: string;
      deep?: string;
      value: V;
      index: number;
      toDate: ToDate<V>;
      FromTimestamp: FromTimestamp<V>;
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
      disabled?: boolean | undefined;
      readOnly?: boolean | undefined;
      className?: string;
      id?: string;
      style?: React.CSSProperties;
      autoFocus?: boolean;
    }) => React.DetailedReactHTMLElement<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >;
    TextArea: (props: {
      name: string;
      deep?: string;
      index: number;
      value: string;
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
      disabled?: boolean;
      className?: string;
      id?: string;
      style?: React.CSSProperties;
      autoFocus?: boolean;
      placeholder?: string;
    }) => React.DetailedReactHTMLElement<
      React.InputHTMLAttributes<HTMLTextAreaElement>,
      HTMLTextAreaElement
    >;
    CheckBox: (props: {
      label: string;
      index: number;
      name: string;
      deep?: string;
      value: boolean;
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
      className?: string;
      style?: React.CSSProperties;
    }) => React.DetailedReactHTMLElement<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >;
    Selection: <V>(props: {
      index: number;
      name: string;
      deep?: string;
      value: V;
      /** {
       *    value1: label1,
       *    value2: label2,
       *    WW: 'World Wide',
       *    IN: 'India',
       *    0: 'Don't include',
       *    1: 'Yes, i am in',
       *    ....
       * } */
      // @ts-ignore
      data: { [Data in V]: string | number };
      onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
      className?: string;
      id?: string;
      style?: React.CSSProperties;
    }) => React.DetailedReactHTMLElement<
      React.SelectHTMLAttributes<HTMLSelectElement>,
      HTMLSelectElement
    >;
    Submit: (props: {
      onSubmit: Function;
      disabled?: boolean;
      children?: string;
      className?: string;
      id?: string;
      style?: React.CSSProperties;
    }) => React.DetailedReactHTMLElement<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >;
  }
] {
  /** Html Inputs design */
  const [value, setValue] = useState<S[]>(() => initState);
  return [
    value,
    ({
      target,
    }: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >): any => {
      const type = target.type;
      const name = target.name;
      const deep = target.dataset.deep;
      const index = Number(target.dataset.index);

      let value: string | number | boolean | Date = target.value || "";
      switch (type) {
        case "text":
        case "textarea":
          value = value.length > 0 ? value : ((target.value = ""), null as any);
          break;
        case "number":
          value = parseInt(value) || ((target.value = ""), null as any);
          break;
        case "url":
          value = value.startsWith("http")
            ? value
            : ((target.value = ""), null as any);
          break;
        case "checkbox":
          // @ts-ignore, checked is only avail for checkbox input, typescript is not working properly
          value = target.checked;
          break;
        case "date":
          // @ts-ignore
          value = target.valueAsDate;
          break;
        case "datetime-local":
          // @ts-ignore
          value = target.valueAsNumber;
      }

      // check for modifier
      if (target.dataset.modifier === "true") {
        const key = name + "" + deep;
        const modifier = formRopStore[key] as Modifier<typeof value>;
        value = modifier(value);
      }

      // for date modifier
      if (target.type === "date" || target.type === "datetime-local") {
        const key = name + "" + deep;
        const FromTimestamp = formRopStore[key] as FromTimestamp<number>;
        value = FromTimestamp(value as number);
      }

      setValue((preState) => {
        const copy = Array.from(preState);
        if (deep) {
          copy[index][name][deep] = value;
        } else copy[index][name] = value;

        return copy;
      });
    },
    (value) => {
      if (Array.isArray(value)) setValue(value);
    },
    (initWith) => {
      setValue(initWith || []);
    },
    // components
    useMemo(
      () => ({
        Input: ({ deep, index, modifier, placeholder, type, ...props }) => {
          if (modifier) {
            const key = props.name + "" + deep;
            formRopStore[key] = modifier;
          }

          if (type === "url" && !placeholder) {
            placeholder = "https://";
          }

          return React.createElement("input", {
            type,
            placeholder,
            ...props,
            autoComplete: "off",
            autoCorrect: "off",
            autoCapitalize: "off",
            spellCheck: "false",
            // this is hack just to pass function or anything in native input!!
            ["data-index"]: index,
            ["data-modifier"]: !!modifier,
            ["data-deep"]: deep,
          }) as any;
        },
        Date: ({ deep, value, index, FromTimestamp, toDate, ...props }) => {
          const key = props.name + "" + deep;
          formRopStore[key] = FromTimestamp;

          return React.createElement("input", {
            ...props,
            type: "datetime",
            value: toDate(value),
            ["data-index"]: index,
            ["data-deep"]: deep,
          }) as any;
        },
        DateTime: ({ deep, value, index, FromTimestamp, toDate, ...props }) => {
          const key = props.name + "" + deep;
          formRopStore[key] = FromTimestamp;

          return React.createElement("input", {
            ...props,
            type: "datetime-local",
            value: toDate(value),
            ["data-index"]: index,
            ["data-deep"]: deep,
          }) as any;
        },
        TextArea: ({ index, deep, ...props }) =>
          React.createElement("textarea", {
            ...props,
            autoComplete: "off",
            autoCorrect: "off",
            autoCapitalize: "off",
            spellCheck: "false",
            ["data-index"]: index,
            ["data-deep"]: deep,
          }) as any,
        CheckBox: ({ index, deep, value, label, ...props }) =>
          React.createElement(React.Fragment, {
            children: [
              React.createElement("input", {
                ...props,
                ["data-index"]: index,
                ["data-deep"]: deep,
                id: props.name,
                type: "checkbox",
                checked: value,
              }),
              React.createElement("label", {
                htmlFor: props.name,
                children: label,
              }),
            ],
          }) as any,
        Selection: ({ index, deep, data, ...props }) => {
          return React.createElement(
            "select",
            {
              ...props,
              ["data-index"]: index,
              ["data-deep"]: deep,
            },
            Object.entries(data).map(([value, label]) => {
              return React.createElement(
                "option",
                {
                  key: value,
                  value: value,
                },
                label as string
              );
            })
          ) as any;
        },
        Submit: ({ onSubmit, ...props }) =>
          React.createElement("button", {
            ...props,
            type: "button",
            onClick: () => onSubmit(),
          }),
      }),
      []
    ),
  ];
}
