"use dom";
import { Button } from "@/components/shadcn/ui/button";
import { authClient } from "@/src/client/auth-client";
import { FormEvent, useState } from "react";
import { SafeAreaView } from "react-native";
import "../global.css";

export default function HomeScreen() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string | number>("");
  const [error, setNameError] = useState<string>("");

  const handleSignup = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      name,
      email,
      password,
    };
    authClient.signUp.email(
      {
        email,
        name,
        password: String(password),
      },
      {
        onError(context) {
          console.log("error", context);
          setNameError(context.error.message);
        },
        onSuccess(context) {
          console.log("success", context);
        },
      }
    );
    console.log(payload);
  };
  return (
    <SafeAreaView className={`flex-1 flex flex-col p-2`}>
      <form
        className="flex-1 flex flex-col  items-center gap-2 justify-center"
        onSubmit={handleSignup}
      >
        <input
          placeholder="Name"
          type="text"
          className="w-[50%] border-gray-400/50 border-2 p-2 rounded-md"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Email"
          type="email"
          className="w-[50%] border-gray-400/50 border-2 p-2 rounded-md"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          className="w-[50%] border-gray-400/50 border-2 p-2 rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex flex-col space-y-3">
          <Button type="submit" variant="default">
            Submit
          </Button>
          {!!error && <p className="text-red-600">{error}</p>}
        </div>
      </form>
    </SafeAreaView>
  );
}
