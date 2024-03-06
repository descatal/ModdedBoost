import RunningProcessModal from "@/components/modal/running-process-modal.tsx";
import InitializeModal from "@/components/modal/initialize-modal.tsx";
import UpdateModal from "@/components/modal/update-modal.tsx";

const Modals = () => {
  return (
    <div>
      <RunningProcessModal/>
      <InitializeModal/>
      <UpdateModal/>
    </div>
  );
};

export default Modals;