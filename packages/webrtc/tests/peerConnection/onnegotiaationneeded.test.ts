// webrtc/RTCPeerConnection-onnegotiationneeded.html

import { RTCPeerConnection } from "../../src";
import { generateAudioReceiveOnlyOffer } from "../utils";

describe("onnegotiationneeded", () => {
  test("Creating first data channel should fire negotiationneeded event", async () => {
    const pc = new RTCPeerConnection();

    const negotiated = awaitNegotiation(pc);

    pc.createDataChannel("test");
    await negotiated;
    await pc.close();
  });

  test("calling createDataChannel twice should fire negotiationneeded event once", async (done) => {
    const pc = new RTCPeerConnection();
    const negotiated = awaitNegotiation(pc);

    pc.createDataChannel("foo");
    negotiated.then(({ nextPromise }) => {
      pc.createDataChannel("bar");
      nextPromise.then(() => {
        throw new Error();
      });
      setTimeout(() => {
        pc.close();
        done();
      }, 100);
    });
  });

  test("addTransceiver() should fire negotiationneeded event", async () => {
    const pc = new RTCPeerConnection();
    const negotiated = awaitNegotiation(pc);

    pc.addTransceiver("audio");
    await negotiated;
    await pc.close();
  });

  test("Calling addTransceiver() twice should fire negotiationneeded event once", async (done) => {
    const pc = new RTCPeerConnection();
    const negotiated = awaitNegotiation(pc);

    pc.addTransceiver("audio");
    negotiated.then(({ nextPromise }) => {
      pc.addTransceiver("video");
      nextPromise.then(() => {
        throw new Error();
      });
      setTimeout(() => {
        pc.close();
        done();
      }, 100);
    });
  });

  test("Calling both addTransceiver() and createDataChannel() should fire negotiationneeded event once", async (done) => {
    const pc = new RTCPeerConnection();
    const negotiated = awaitNegotiation(pc);

    pc.createDataChannel("test");
    negotiated.then(({ nextPromise }) => {
      pc.addTransceiver("video");
      nextPromise.then(() => {
        throw new Error();
      });
      setTimeout(() => {
        pc.close();
        done();
      }, 100);
    });
  });

  xtest("negotiationneeded event should not fire if signaling state is not stable", async (done) => {
    const pc = new RTCPeerConnection();
    let negotiated;

    generateAudioReceiveOnlyOffer(pc)
      .then((offer) => {
        pc.setLocalDescription(offer);
        negotiated = awaitNegotiation(pc);
      })
      .then(() => negotiated)
      .then(({ nextPromise }) => {
        expect(pc.signalingState).toBe("have-local-offer");
        pc.createDataChannel("test");
        nextPromise.then(() => {
          throw new Error();
        });
        setTimeout(() => {
          pc.close();
          done();
        }, 100);
      });
  });
});

function awaitNegotiation(pc: RTCPeerConnection) {
  if (pc.onnegotiationneeded) {
    throw new Error(
      "connection is already attached with onnegotiationneeded event handler"
    );
  }

  function waitNextNegotiation() {
    return new Promise<any>((resolve) => {
      pc.onnegotiationneeded = (event) => {
        const nextPromise = waitNextNegotiation();
        resolve({ nextPromise, event });
      };
    });
  }

  return waitNextNegotiation();
}
