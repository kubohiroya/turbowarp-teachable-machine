# Dark / Light brightness model

This analytic example is original to this repository and licensed under MPL-2.0 (see LICENSE). It contains no externally trained or downloaded model weights and no personal training images. It is compatible with the image runtime file loader, but was not exported by Google Teachable Machine.

Input is a normalized RGB tensor `[batch,32,32,3]` in `[-1,1]`. GlobalAveragePooling2D produces mean R/G/B. Dense softmax uses a `[3,2]` kernel `[-4,4,-4,4,-4,4]` and bias `[0,0]`. Dark and Light logits are minus/plus 4 times the RGB means sum. This is only a brightness threshold demonstration, not general object recognition.

`model.json` is the editable topology; `metadata.json` contains the two labels and input size. Regenerate the 32-byte little-endian weight file with `node scripts/build-sample-model.mjs`. The manifest checksums must be updated when model assets change. Local CPU TensorFlow validation checks black and white tensor fixtures; real camera accuracy/lighting and the capture path remain unverified.
