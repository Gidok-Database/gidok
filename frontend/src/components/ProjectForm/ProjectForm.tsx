import { useState } from "react";
import "@/components/ProjectForm/ProjectForm.css";

interface ProjectFormProps {
  onAdd: (newRepo: {
    name: string;
    type: "docs" | "ppt";
    updated: string;
  }) => void;
}

export default function ProjectForm({ onAdd }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"docs" | "ppt">("docs");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name,
      type,
      updated: "Just now",
    });

    setName("");
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
      <select
        value={type}
        onChange={(e) => setType(e.target.value as "docs" | "ppt")}
      >
        <option value="docs">📄 문서</option>
        <option value="ppt">📊 발표자료</option>
      </select>
      <button type="submit">추가</button>
    </form>
  );
}
