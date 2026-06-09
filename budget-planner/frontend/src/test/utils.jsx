// Helper render kèm providers thật (i18n + router + theme) cho test component.
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import i18n from "../i18n/index.js";
import ColorModeProvider from "../theme/ColorModeContext.jsx";

/** Render `ui` trong I18nextProvider + MemoryRouter + ColorModeProvider. */
export function renderWithProviders(ui, { route = "/" } = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter
        initialEntries={[route]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ColorModeProvider>{ui}</ColorModeProvider>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

export { i18n };
export * from "@testing-library/react";
export { userEvent };
