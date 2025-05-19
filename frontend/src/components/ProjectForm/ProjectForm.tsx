import { useState } from "react";
import "@/components/ProjectForm/ProjectForm.css";

interface ProjectFormProps {
  onAdd: (newRepo: {
    name: string;
    permission: "admin" | "user";
    type: "docs" | "ppt";
    updated: string;
  }) => void;
}

export default function ProjectForm({ onAdd }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [permission, setPermission] = useState<"admin" | "user">("user");
  const [type, setType] = useState<"docs" | "ppt">("docs");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name,
      permission,
      type,
      updated: "Just now",
    });

    setName("");
    setPermission("user");
    setType("docs");
  };

  return (
    <form className="add-repo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="프로젝트 이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <select value={permission} onChange={(e) => setPermission(e.target.value as "admin" | "user")}>
        <option value="admin">관리자</option>
        <option value="user">일반 사용자</option>
      </select>
      <select value={type} onChange={(e) => setType(e.target.value as "docs" | "ppt")}>
        <option value="docs">📄 문서</option>
        <option value="ppt">📊 발표자료</option>
      </select>
      <button type="submit">추가</button>
    </form>
  );
}
