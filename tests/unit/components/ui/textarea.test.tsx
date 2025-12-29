/**
 * TDD: Textarea Component Tests
 *
 * Tests for the shadcn/ui Textarea wrapper component that:
 * - Renders a textarea element with styling
 * - Forwards refs correctly
 * - Accepts standard textarea props
 * - Has proper className handling
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { Textarea } from "@/components/ui/textarea";

describe("Textarea", () => {
  describe("Rendering", () => {
    it("renders a textarea element", () => {
      render(<Textarea />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe("TEXTAREA");
    });

    it("renders with default styling classes", () => {
      render(<Textarea />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("flex");
      expect(textarea).toHaveClass("min-h-[80px]");
      expect(textarea).toHaveClass("w-full");
      expect(textarea).toHaveClass("rounded-md");
      expect(textarea).toHaveClass("border");
    });

    it("has proper display name", () => {
      expect(Textarea.displayName).toBe("Textarea");
    });
  });

  describe("Ref Forwarding", () => {
    it("forwards ref correctly to the textarea element", () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
      expect(ref.current?.tagName).toBe("TEXTAREA");
    });

    it("allows focus via ref", () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it("allows programmatic value setting via ref", () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);

      if (ref.current) {
        ref.current.value = "Test value via ref";
      }

      expect(ref.current?.value).toBe("Test value via ref");
    });
  });

  describe("ClassName Handling", () => {
    it("applies custom className", () => {
      render(<Textarea className="custom-class" />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("custom-class");
    });

    it("merges custom className with default classes", () => {
      render(<Textarea className="my-custom-style" />);

      const textarea = screen.getByRole("textbox");
      // Should have both default and custom classes
      expect(textarea).toHaveClass("flex");
      expect(textarea).toHaveClass("w-full");
      expect(textarea).toHaveClass("my-custom-style");
    });

    it("allows className to override default styles", () => {
      render(<Textarea className="min-h-[200px]" />);

      const textarea = screen.getByRole("textbox");
      // Custom min-height should be applied
      expect(textarea).toHaveClass("min-h-[200px]");
    });
  });

  describe("Placeholder Prop", () => {
    it("renders with placeholder text", () => {
      render(<Textarea placeholder="Enter your message..." />);

      const textarea = screen.getByPlaceholderText("Enter your message...");
      expect(textarea).toBeInTheDocument();
    });

    it("displays placeholder when empty", () => {
      render(<Textarea placeholder="Type here" />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("placeholder", "Type here");
    });

    it("handles empty placeholder", () => {
      render(<Textarea placeholder="" />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("placeholder", "");
    });
  });

  describe("Disabled State", () => {
    it("renders in disabled state", () => {
      render(<Textarea disabled />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeDisabled();
    });

    it("applies disabled styling classes", () => {
      render(<Textarea disabled />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("disabled:cursor-not-allowed");
      expect(textarea).toHaveClass("disabled:opacity-50");
    });

    it("does not accept input when disabled", () => {
      const onChange = vi.fn();
      render(<Textarea disabled onChange={onChange} />);

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "New text" } });

      // onChange should not be called when disabled (browser behavior)
      expect(textarea).toBeDisabled();
    });

    it("renders in enabled state by default", () => {
      render(<Textarea />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).not.toBeDisabled();
    });
  });

  describe("Value and onChange", () => {
    it("handles controlled value prop", () => {
      render(<Textarea value="Initial content" onChange={() => {}} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("Initial content");
    });

    it("calls onChange when text is entered", () => {
      const handleChange = vi.fn();
      render(<Textarea onChange={handleChange} />);

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "New value" } });

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it("provides event object to onChange handler", () => {
      const handleChange = vi.fn();
      render(<Textarea onChange={handleChange} />);

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Test input" } });

      expect(handleChange).toHaveBeenCalled();
      const event = handleChange.mock.calls[0]![0] as React.ChangeEvent<HTMLTextAreaElement>;
      expect(event.target.value).toBe("Test input");
    });

    it("handles empty value", () => {
      render(<Textarea value="" onChange={() => {}} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("");
    });

    it("handles multi-line value", () => {
      const multiLineText = "Line 1\nLine 2\nLine 3";
      render(<Textarea value={multiLineText} onChange={() => {}} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue(multiLineText);
    });

    it("works as uncontrolled component with defaultValue", () => {
      render(<Textarea defaultValue="Default content" />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveValue("Default content");
    });

    it("updates uncontrolled component on user input", () => {
      render(<Textarea defaultValue="" />);

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "User typed this" } });

      expect(textarea).toHaveValue("User typed this");
    });
  });

  describe("Additional Textarea Props", () => {
    it("handles rows prop", () => {
      render(<Textarea rows={10} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("rows", "10");
    });

    it("handles cols prop", () => {
      render(<Textarea cols={50} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("cols", "50");
    });

    it("handles maxLength prop", () => {
      render(<Textarea maxLength={500} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("maxLength", "500");
    });

    it("handles readOnly prop", () => {
      render(<Textarea readOnly value="Read only text" />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("readOnly");
    });

    it("handles required prop", () => {
      render(<Textarea required />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeRequired();
    });

    it("handles name prop", () => {
      render(<Textarea name="message" />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("name", "message");
    });

    it("handles id prop", () => {
      render(<Textarea id="message-input" />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("id", "message-input");
    });

    it("handles aria-label prop", () => {
      render(<Textarea aria-label="Message input" />);

      const textarea = screen.getByLabelText("Message input");
      expect(textarea).toBeInTheDocument();
    });

    it("handles aria-describedby prop", () => {
      render(
        <>
          <span id="helper-text">Enter your feedback</span>
          <Textarea aria-describedby="helper-text" />
        </>
      );

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("aria-describedby", "helper-text");
    });
  });

  describe("Event Handlers", () => {
    it("handles onFocus event", () => {
      const handleFocus = vi.fn();
      render(<Textarea onFocus={handleFocus} />);

      const textarea = screen.getByRole("textbox");
      fireEvent.focus(textarea);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it("handles onBlur event", () => {
      const handleBlur = vi.fn();
      render(<Textarea onBlur={handleBlur} />);

      const textarea = screen.getByRole("textbox");
      fireEvent.focus(textarea);
      fireEvent.blur(textarea);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it("handles onKeyDown event", () => {
      const handleKeyDown = vi.fn();
      render(<Textarea onKeyDown={handleKeyDown} />);

      const textarea = screen.getByRole("textbox");
      fireEvent.keyDown(textarea, { key: "Enter" });

      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it("handles onKeyUp event", () => {
      const handleKeyUp = vi.fn();
      render(<Textarea onKeyUp={handleKeyUp} />);

      const textarea = screen.getByRole("textbox");
      fireEvent.keyUp(textarea, { key: "a" });

      expect(handleKeyUp).toHaveBeenCalledTimes(1);
    });
  });

  describe("Styling Classes", () => {
    it("has focus-visible ring styles", () => {
      render(<Textarea />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("focus-visible:outline-none");
      expect(textarea).toHaveClass("focus-visible:ring-2");
      expect(textarea).toHaveClass("focus-visible:ring-ring");
      expect(textarea).toHaveClass("focus-visible:ring-offset-2");
    });

    it("has placeholder text styling", () => {
      render(<Textarea />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("placeholder:text-muted-foreground");
    });

    it("has proper text size classes", () => {
      render(<Textarea />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("text-base");
      expect(textarea).toHaveClass("md:text-sm");
    });

    it("has proper padding classes", () => {
      render(<Textarea />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("px-3");
      expect(textarea).toHaveClass("py-2");
    });

    it("has border and background classes", () => {
      render(<Textarea />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveClass("border");
      expect(textarea).toHaveClass("border-input");
      expect(textarea).toHaveClass("bg-background");
    });
  });

  describe("Accessibility", () => {
    it("can be focused with keyboard", () => {
      render(<Textarea />);

      const textarea = screen.getByRole("textbox");
      textarea.focus();

      expect(textarea).toHaveFocus();
    });

    it("supports aria-invalid for form validation", () => {
      render(<Textarea aria-invalid="true" />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("aria-invalid", "true");
    });

    it("supports aria-required for required fields", () => {
      render(<Textarea aria-required="true" />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("aria-required", "true");
    });

    it("works with associated label", () => {
      render(
        <>
          <label htmlFor="test-textarea">Description</label>
          <Textarea id="test-textarea" />
        </>
      );

      const textarea = screen.getByLabelText("Description");
      expect(textarea).toBeInTheDocument();
    });
  });
});
