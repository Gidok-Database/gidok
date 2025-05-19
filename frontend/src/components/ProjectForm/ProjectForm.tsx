import { useState } from "react";
import "@/components/ProjectForm/ProjectForm.css";

interface AddRepositoryFormProps {
  onAdd: (newRepo: {
    name: string;
    permission: "admin" | "user";
    language: string;
    license: string;
    updated: string;
  }) => void;
}

export default function AddRepositoryForm({ onAdd }: AddRepositoryFormProps) {
  const [name, setName] = useState("");
  const [permission, setPermission] = useState<"admin" | "user">("user");
  const [language, setLanguage] = useState("");
  const [license, setLicense] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name,
      permission,
      language,
      license,
      updated: "Just now",
    });

    setName("");
    setLanguage("");
    setLicense("");
    setPermission("user");
  };

  return (
    <form className="add-repo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Repository Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <select value={permission} onChange={(e) => setPermission(e.target.value as "admin" | "user")}>
        <option value="admin">관리자</option>
        <option value="user">일반 사용자</option>
      </select>
      <input
        type="text"
        placeholder="Language"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      />
      <input
        type="text"
        placeholder="License"
        value={license}
        onChange={(e) => setLicense(e.target.value)}
      />
      <button type="submit">추가</button>
    </form>
  );
}
