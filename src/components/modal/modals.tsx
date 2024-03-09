import RunningProcessModal from "@/components/modal/running-process-modal.tsx";
import InitializeModal from "@/components/modal/initialize-modal.tsx";
import UpdateModal from "@/components/modal/update-modal.tsx";
import InvalidPathModal from "@/components/modal/invalid-path-modal.tsx";

const Modals = () => {
  return (
    <div>
      <RunningProcessModal/>
      <InitializeModal/>
      <UpdateModal/>
      <InvalidPathModal/>
    </div>
  );
};

export default Modals;