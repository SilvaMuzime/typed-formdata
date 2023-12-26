import { z, type ZodError, ZodObject, } from "zod";
import Input from "./Input";
import RadioInput from "./RadioInput";
import { FormEvent } from "react";

const ZProfileSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
  avatar: z.instanceof(File),
  preferences: z.string().array(),
});
type TProfile = z.infer<typeof ZProfileSchema>;

type TRecord = Record<string, string | number | File | Array<string> | Array<number> | Array<File>>;
function castFormData<T extends TRecord>(formData: FormData, schema: ZodObject<any>): T | ZodError {

  function dedupeFormDataKeys(formData: FormData) {
    const keySet = new Set<string>();

    formData.forEach((_, key) => {
      keySet.add(key);
    })

    return [...keySet];
  }

  type TZodShapeDefTypeName = "ZodString" | "ZodEffects" | "ZodArray";
  type TKeyType = "multi-value" | "single-value";
  type TMappedFormDataKeys = Map<string, TKeyType>;
  function mapKeys(formData: FormData): TMappedFormDataKeys {
    const keyMap = new Map<string, TKeyType>();
    const uniqueKeys = dedupeFormDataKeys(formData);

    uniqueKeys.forEach(key => {
      const shapeFieldType = schema.shape[key]._def.typeName as TZodShapeDefTypeName;
      if (shapeFieldType === "ZodArray") keyMap.set(key, "multi-value");
      else keyMap.set(key, "single-value");
    });

    return keyMap;
  };

  const profile = {} as TRecord;
  const uniqueKeys = mapKeys(formData);

  uniqueKeys.forEach((value, key) => {
    if (value === "single-value") {
      profile[key] = formData.get(key) as string | File;
    } else {
      profile[key] = formData.getAll(key) as Array<string> | Array<File>;
    }
  });

  try {
    return schema.parse(profile);
  } catch (error) {
    return error as ZodError;
  }
}

const PREFERENCES = new Map<"theme" | "notifications", Array<string>>(
  [
    ["theme", ["Dark", "Light", "System"]],
    ["notifications", ["None", "Daily", "Weekly", "Monthly"]],
  ]
);

function App() {

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    console.log(castFormData<TProfile>(formData, ZProfileSchema));
  }

  return (
    <>
      <main className="text-white max-w-[320px] mx-auto">
        <h1 className="font-mono text-2xl py-8">Create your Profile</h1>
        <form className="flex flex-col gap-6 font-sans" onSubmit={handleSubmit}>
          <Input className="rounded-md py-1 px-2 text-gray-900" label="Username" name="username" type="text" inputMode="text" autoComplete="username" autoFocus required />
          <Input className="rounded-md py-1 px-2 text-gray-900" label="Email" name="email" type="email" inputMode="email" required />
          <fieldset name="preferences">
            <legend className="text-white font-sans">Theme</legend>
            {
              PREFERENCES.get("theme")!.map(pref => (
                <RadioInput key={pref} className="accent-fuchsia-600 w-4 h-4" label={pref} name="theme" value={`theme.${pref.toLowerCase()}`} />
              ))
            }
            <legend className="text-white mt-8 font-sans">Notifications</legend>
            {
              PREFERENCES.get("notifications")!.map(pref => (
                <RadioInput key={pref} className="accent-fuchsia-600 w-4 h-4" label={pref} name="notifications" value={`notifications.${pref.toLowerCase()}`} />
              ))
            }
          </fieldset>
          <Input className="rounded-md py-1 px-2 text-gray-900" label="Password" name="password" type="password" inputMode="text" autoComplete="new-password" required />
          <button type="submit" className="bg-fuchsia-600 font-sans font-bold py-2 px-4 text-white rounded-md">Register</button>
        </form>
      </main>
    </>
  )
}

export default App;
