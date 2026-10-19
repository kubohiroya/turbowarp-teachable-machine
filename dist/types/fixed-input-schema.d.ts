import type { SchemaBundle } from '@kubohiroya/turbowarp-extension-data-editor/schema';
/** Owner canonical fragments, distinct from older SOURCE/editor schemas. */
export declare function fixedInputBundle(opcode: string, argument: string): SchemaBundle;
export declare const fixedSchemas: {
    setRecognitionMode: {
        type: string;
        properties: {
            MODE: {
                type: string;
                enum: string[];
            };
        };
    };
    setComputeMode: {
        type: string;
        properties: {
            MODE: {
                type: string;
                enum: string[];
            };
        };
    };
    setPreviewOpacity: {
        type: string;
        properties: {
            OPACITY: {
                type: string;
                $comment: string;
            };
        };
    };
    setPreviewPosition: {
        type: string;
        properties: {
            POSITION: {
                type: string;
                enum: string[];
            };
        };
    };
    setPreviewMirroring: {
        type: string;
        properties: {
            MIRRORING: {
                type: string;
                enum: string[];
            };
        };
    };
    setPoseOverlayVisibility: {
        type: string;
        properties: {
            VISIBILITY: {
                type: string;
                enum: string[];
            };
        };
    };
    setPoseJointStyle: {
        type: string;
        properties: {
            PART: {
                type: string;
                enum: string[];
            };
            OPACITY: {
                type: string;
                $comment: string;
            };
            RADIUS: {
                type: string;
                $comment: string;
            };
        };
    };
    setPoseBoneStyle: {
        type: string;
        properties: {
            OPACITY: {
                type: string;
                $comment: string;
            };
            WIDTH: {
                type: string;
                $comment: string;
            };
        };
    };
    setPoseOverlayMinimumConfidence: {
        type: string;
        properties: {
            CONFIDENCE: {
                type: string;
                $comment: string;
            };
        };
    };
    setPoseConfidenceScaling: {
        type: string;
        properties: {
            PROPERTY: {
                type: string;
                enum: string[];
            };
            STATE: {
                type: string;
                enum: string[];
            };
        };
    };
    setAccumulatedPoseParameters: {
        type: string;
        properties: {
            ACCUMULATION: {
                type: string;
                $comment: string;
            };
            DECAY: {
                type: string;
                $comment: string;
            };
        };
    };
    setAccumulatedPoseThreshold: {
        type: string;
        properties: {
            THRESHOLD: {
                type: string;
                $comment: string;
            };
        };
    };
    isPoseWithThreshold: {
        type: string;
        properties: {
            THRESHOLD: {
                type: string;
                $comment: string;
            };
        };
    };
};
