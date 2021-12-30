import { once, showUI, on, loadFontsAsync } from '@create-figma-plugin/utilities'
import { CloseHandler, LoadHandler, SubmitHandler, SuccessHandler, WarnHandler } from './types'

export default function () {
  let datasets: Record<string, any> = {};
  let data: any[] = [];
  let activeTabIndex = 0;
  let keys: string[] = [];

  function getData() {
    // Get keys of data after import
    for (const dataNodes of datasets[activeTabIndex]) {
      keys = Object.keys(dataNodes);
    }
  }

  async function selectData(iterate = true) {
    // For iteration
    const length = datasets[activeTabIndex].length;
    let usedKeys: string[] = [];

    // Get selection
    for (const node of figma.currentPage.selection) {

      // If selection is single TextNode
      if (node.type === "TEXT") {
        for (const key of keys) {
          await loadFontsAsync([node]);

          if (node.name === key) {
            node.characters = data[0][key].toString();
          }
        }
      }

      // If selection contains more TextNodes
      else {

        // Get keys of data
        for (const key of keys) {

          // Texts
          // Find elements in selection that match any key of data
          // @ts-ignore
          const textLayers = node.findAll(node => node.name === key && node.type === 'TEXT');

          // Rewrite layer text with value of each key but go the next index if key doubles
          let index = 0;
          if (iterate === true) {
            await loadFontsAsync(textLayers);
            for (const layer of textLayers) {
              // If duplicates
              if (usedKeys.includes(key)) {
                index++;
                usedKeys = [];
              }
              // If index reached its end
              index = (index >= length) ? 0 : index;
              layer.characters = datasets[activeTabIndex][index][key].toString();

              // Add key to used keys
              usedKeys.push(key);
            }
          }

          // Rewrite layer text with value of each key
          else {
            for (const layer of textLayers) {
              await loadFontsAsync([layer]);

              layer.characters = datasets[activeTabIndex][0][key].toString();
            }
          }
        }
      }
    }
  }



  on<LoadHandler>('LOAD', (msg) => {
    data = msg.data;
    datasets[activeTabIndex] = data;

    // if single object, wrap in array
    if (datasets[activeTabIndex].length === undefined) {
      datasets[activeTabIndex] = [data];
    }

    if (msg.data !== []) {

      // Load every text style in use once
      const textNodes = figma.root.findAll(node => node.type === "TEXT") as SceneNode[];
      loadFontsAsync(textNodes);
    }
  })

  on<SuccessHandler>('SUCCESS', () => {
    figma.notify('Nhập dữ liệu thành công!');
  })

  on<SubmitHandler>('SUBMIT', () => {
    getData();
    selectData();
  })

  once<CloseHandler>('CLOSE', () => {
    figma.closePlugin()
  })

  on<WarnHandler>('WARN', ({type}) => {
    switch (type) {
      case 'EMPTY_OBJECT':
        figma.notify('Phát hiện ra một số đối tượng trống rỗng và đã bị loại bỏ.');
        break;
        case 'NON_ARRAY':
          figma.notify('Dữ liệu đầu vào không hợp lệ. Vui lòng nhập dữ liệu vào một mảng.');
          break;
      default:
        break;
    }

  })

  showUI({
    width: 250,
    height: 500
  })
}
