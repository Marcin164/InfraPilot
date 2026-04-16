import type { Editor } from "@tiptap/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faHeading,
  faListUl,
  faListOl,
  faQuoteLeft,
  faLink,
  faUnlink,
  faImage,
  faMinus,
  faCode,
  faRotateLeft,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";

type Props = { editor: Editor };

const ToolbarButton = ({
  onClick,
  active,
  icon,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  icon: any;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`flex h-[30px] w-[30px] items-center justify-center rounded-[6px] text-[13px] transition cursor-pointer ${
      active
        ? "bg-[#2B9AE9] text-white"
        : "text-[#535353] hover:bg-[#F0F0F0]"
    }`}
  >
    <FontAwesomeIcon icon={icon} />
  </button>
);

const Divider = () => <div className="mx-1 h-[20px] w-px bg-[#E0E0E0]" />;

const Toolbar = ({ editor }: Props) => {
  const addLink = () => {
    const url = prompt("URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = prompt("Image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-[2px] border-b border-[#E0E0E0] px-2 py-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        icon={faBold}
        title="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        icon={faItalic}
        title="Italic"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        icon={faUnderline}
        title="Underline"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        icon={faStrikethrough}
        title="Strikethrough"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        icon={faCode}
        title="Inline code"
      />

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        icon={faHeading}
        title="Heading"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        icon={faListUl}
        title="Bullet list"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        icon={faListOl}
        title="Ordered list"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        icon={faQuoteLeft}
        title="Blockquote"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        icon={faMinus}
        title="Horizontal rule"
      />

      <Divider />

      <ToolbarButton
        onClick={addLink}
        active={editor.isActive("link")}
        icon={faLink}
        title="Add link"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        icon={faUnlink}
        title="Remove link"
      />
      <ToolbarButton onClick={addImage} icon={faImage} title="Insert image" />

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        icon={faRotateLeft}
        title="Undo"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        icon={faRotateRight}
        title="Redo"
      />
    </div>
  );
};

export default Toolbar;
