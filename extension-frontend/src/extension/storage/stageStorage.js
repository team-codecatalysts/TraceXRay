export const saveStage1 = (data) => {

  chrome.storage.local.set({
    stage1_output: data
  });

};

export const getStage1 = () => {

  return new Promise((resolve) => {

    chrome.storage.local.get("stage1_output", (res) => {
      resolve(res.stage1_output);
    });

  });

};