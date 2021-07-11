import React from "react";
import ReactDOM from "react-dom";
import MenuWrapper from "./MenuWrapper";
import "./index.css";
import {MuiThemeProvider} from "@material-ui/core";
import {MenuTheme} from "./styles/theme";
import {RecoilRoot} from "recoil";
import {KeyboardNavProvider} from "./provider/KeyboardNavProvider";
import {SnackbarProvider} from "notistack";
import {PlayerDataProvider} from "./provider/PlayerDataProvider";

ReactDOM.render(
  <RecoilRoot>
    <MuiThemeProvider theme={MenuTheme}>
      <KeyboardNavProvider>
        <PlayerDataProvider>
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{vertical: "bottom", horizontal: "center"}}
            disableWindowBlurListener={true}
          >
            <React.Suspense fallback={<></>}>
              <MenuWrapper/>
            </React.Suspense>
          </SnackbarProvider>
        </PlayerDataProvider>
      </KeyboardNavProvider>
    </MuiThemeProvider>
  </RecoilRoot>,
  document.getElementById("root")
);
