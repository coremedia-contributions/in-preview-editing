import React, { useState } from "react";
import ReactDOM from "react-dom";

interface AppProps {
  shadowRoot: ShadowRoot;
}

const App: React.FC<AppProps> = ({ shadowRoot }) => {
  const [open, setOpen] = useState(false);

  console.log("ShadowRoot", shadowRoot);

  // Portal for overlay
  const overlayRoot = document.createElement("div");
  document.body.appendChild(overlayRoot);

  return (
    <>
      <button
        className="plugin-button"
        onClick={() => setOpen(!open)}
      >
        Toggle Overlay
      </button>

      {open &&
        ReactDOM.createPortal(
          <div className="overlay">
            <p><b>Overlay from Plugin</b></p>
            <p>Rendered via React Portal on top of host page.</p>
          </div>,
          overlayRoot
        )}
    </>
  );
};

export default App;
