"use strict";
const eventemitter2_1 = require("eventemitter2");
const errors_1 = require("./errors");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (opts) => {
    const realOpts = Object.assign({
        transports: {},
    }, opts);
    const nanoserviceModule = (service, config) => {
        config = Object.assign({
            args: null,
            services: {},
            transports: {},
            links: [],
            env: {},
        }, config);
        const emitter = new eventemitter2_1.EventEmitter2({});
        const ins = service({
            args: config.args,
            out: (name, data) => {
                emitter.emit(name, data);
            },
            env: (name) => {
                if (typeof (config.env) !== "undefined" && typeof (config.env[name]) !== "undefined") {
                    return config.env[name];
                }
                throw new Error("Unknown environment variable: " + name);
            },
        });
        if (typeof (ins) !== "undefined") {
            Object.keys(ins).map((inName) => {
                emitter.on(inName, ins[inName]);
            });
        }
        let transports = {};
        // Add transports
        if (typeof (config.transports) !== "undefined") {
            const configTransports = config.transports;
            Object.keys(configTransports).map((transportName) => {
                const transportConfig = configTransports[transportName];
                const transportClass = realOpts.transports[transportConfig.type];
                if (!transportClass) {
                    throw new Error(errors_1.default.unknownTransportType(transportName, transportConfig));
                }
                transports[transportName] = transportClass(transportConfig.opts);
            });
        }
        if (typeof (config.links) !== "undefined") {
            config.links.map((link) => {
                switch (link.type) {
                    case "in":
                        transports[link.transport].in(link.to, emitter.emit.bind(emitter, link.name));
                        break;
                    case "out":
                        emitter.on(link.name, transports[link.transport].out(link.to));
                        break;
                    default:
                }
            });
            emitter.links = config.links;
        }
        else {
            emitter.links = [];
        }
        return emitter;
    };
    return nanoserviceModule;
};
