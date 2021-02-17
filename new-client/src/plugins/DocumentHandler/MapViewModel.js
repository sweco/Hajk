export default class MapViewModel {
  constructor(settings) {
    this.localObserver = settings.localObserver;
    this.globalObserver = settings.globalObserver;
    this.map = settings.map;
    this.bindSubscriptions();
  }

  convertMapSettingsUrlToOlSettings = (inputUrl) => {
    let url = inputUrl.toLowerCase();
    if (url.includes("x=") && url.includes("y=") && url.includes("z=")) {
      let url = inputUrl.split("&");
      let x = url[1].substring(2);
      let y = url[2].substring(2);
      let z = url[3].substring(2);
      let l = url[4]?.substring(2);
      let center = [x, y];
      let zoom = z;
      return {
        center: center,
        zoom: zoom,
        layers: l,
      };
    }
  };

  bindSubscriptions = () => {
    this.localObserver.subscribe("fly-to", (url) => {
      this.globalObserver.publish("core.minimizeWindow");
      this.displayMap(this.convertMapSettingsUrlToOlSettings(url));
    });
  };

  displayMap(mapSettings) {
    console.log("displayMap");
    let visibleLayers = mapSettings.layers.split(",");
    const layers = this.map.getLayers().getArray();

    visibleLayers.forEach((arrays) =>
      layers
        .filter(
          (layer) =>
            layer.getProperties()["layerInfo"] &&
            layer.getProperties()["layerInfo"]["layerType"]
        )
        .forEach((layer) => {
          if (layer.getProperties()["name"] === arrays) {
            console.log(
              "displayMap publish layerswitcher.showLayer on " +
                layer.getProperties()["name"]
            );
            this.globalObserver.publish("layerswitcher.showLayer", layer);
            //layer.setVisible(true);
          } else {
            if (
              visibleLayers.some(
                (arrays) => arrays === layer.getProperties()["name"]
              )
            ) {
              if (layer.layerType === "group") {
                console.log(
                  "displayMap publish layerswitcher.showLayer on " +
                    layer.getProperties()["name"]
                );
                this.globalObserver.publish("layerswitcher.showLayer", layer);
              } else {
                if (!layer.getVisible()) {
                  console.log(
                    "displayMap setting visible on " +
                      layer.getProperties()["name"]
                  );
                  layer.setVisible(true);
                }
              }
            } else {
              if (layer.layerType === "group") {
                console.log(
                  "displayMap publish layerswitcher.showLayer on " +
                    layer.getProperties()["name"]
                );
                this.globalObserver.publish("layerswitcher.hideLayer", layer);
              } else {
                if (layer.getVisible()) {
                  console.log(
                    "displayMap setting hidden on " +
                      layer.getProperties()["name"]
                  );
                  layer.setVisible(false);
                }
              }
            }
          }
        })
    );

    this.flyTo(this.map.getView(), mapSettings.center, mapSettings.zoom);
  }

  flyTo(view, center, zoom) {
    view.animate({
      center: center,
      zoom: zoom,
      duration: 1500,
    });
    this.localObserver.publish("map-animation-complete");
  }
}
