/**
 * GenericExplorer.js
 * -----------------------------------------------------------------------
 * Shared explorer for systems without a bespoke interactive mode in the
 * brief (Digestive System, Nervous System). Still fully interactive:
 * rotate, zoom, and select each structure for detail, with the same
 * smooth model transition used by every other explorer.
 *
 * Model status: PROCEDURAL PLACEHOLDER for both systems (see README +
 * MODEL_MANIFEST -- no verified, clearly-licensed standalone digestive-
 * system or nervous-system GLB was available to this build).
 * -----------------------------------------------------------------------
 */
import { buildGenericSystemModel } from "../anatomy/genericSystemModel.js";

export class GenericExplorer {
  constructor({ viewer, infoPanel, controlsRoot }, system) {
    this.viewer = viewer;
    this.infoPanel = infoPanel;
    this.controlsRoot = controlsRoot;
    this.system = system;
  }

  mount() {
    const model = buildGenericSystemModel(this.system.id, this.system.parts);
    this.viewer.setModelAnimated(model, { selectable: model.userData.selectableParts });
    this.viewer.resetView();
    this.infoPanel.showSystem(this.system);

    this.viewer.onSelect = (partId) => {
      const part = this.system.parts.find((p) => p.id === partId);
      if (part) this.infoPanel.showPart(part, { systemId: this.system.id });
    };

    this.controlsRoot.innerHTML = "";
  }

  unmount() {
    this.controlsRoot.innerHTML = "";
    this.viewer.onSelect = null;
    this.viewer.clearModel();
  }
}
