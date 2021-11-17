<template>
  <div class="main__container">
    <modal
      :confirmationMessage="confirmationMessage"
      :target="imageName"
      :method-name="methodName"
      v-show="modal"
      @execute-method="executeMethod"
    ></modal>

    <h3 class="main__container--heading">CloudFormation実行</h3>
    <div class="main__container--select-image">
      <!-- AMI選択セレクトボックス -->
      <select id="select-image" class="main__container--select ">
        <option hidden>AMIを選択</option>
        <option v-for="(image, i) in images" :key="i" :value="image.imageId">{{
          image.imageName
        }}</option>
      </select>
    </div>

    <!-- 変更セット作成ボタン -->
    <button
      type="button"
      class="main__container--btn main__container--pre-update-btn"
      id="create-change-set-btn"
      @click="
        showModal('選択したAMIで変更セットを作成してもよろしいですか？'),
          (methodName = 'createChangeSet')
      "
    >
      変更セット作成
    </button>

    <!-- ドリフト検出ボタン -->
    <button
      type="button"
      class="main__container--btn main__container--pre-update-btn"
      id="detect-drift-btn"
      @click="
        showModal('ドリフトの検出を行いますか？'), (methodName = 'detectDrift')
      "
    >
      ドリフト検出
    </button>

    <!-- 更新ボタン -->
    <button
      type="button"
      class="main__container--update-btn main__container--btn"
      id="update-stack-btn"
      @click="
        showModal('選択したAMIでCloudFormationスタックを更新しますか？'),
          (methodName = 'updateStack')
      "
    >
      更新
    </button>

    <!-- 作成状況表示 -->
    <div class="main__container--show-status">
      <span v-if="state === 'pending'">
        <img src="../assets/waiting.gif" class="main__container--waiting-img" />
      </span>
      <span :style="{ color }" class="main__container-uptate-message">{{
        updateMessage
      }}</span>
    </div>

    <!-- 更新状況表示 -->
    <div class="main__container--status">
      <div class="main__container--update-status">
        <p class="main__container--status-header">
          更新状況
        </p>

        <img
          src="../assets/reload.png"
          class="main__container--reload-img"
          @click="checkStackStateOnClick()"
          v-show="isLoading === false"
        />
        <img
          src="../assets/half_circle.png"
          class="main__container--reload-wait-img"
          @click="checkStackStateOnClick()"
          v-show="isLoading === true"
        />
      </div>

      <div class="main__container--scroll">
        <div
          class="main__container--status-message"
          v-for="(message, i) in messages"
          :key="i"
          :style="{ color: message.color }"
        >
          {{ message.date }}<br />{{ message.event }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AWS from "aws-sdk";
import CloudFormation from "../cloudformation";
import Modal from "./Modal";
export default {
  name: "UpdateStack",
  components: {
    Modal
  },
  data() {
    return {
      modal: false,
      imageName: "",
      imageId: "",
      stackName: "",
      confirmationMessage: "",
      isLoading: false,
      events: [],
      messages: [],
      color: "",
      methodName: "",
      state: "",
      updateMessage: ""
    };
  },
  props: ["images"],
  methods: {
    /**
     * 入力チェックを行い、モーダルを表示するメソッド
     */
    showModal(message) {
      this.updateMessage = "";
      if (message === "ドリフトの検出を行いますか？") {
        this.imageName = "";
      } else {
        const select = document.getElementById("select-image");
        const selectedIndex = select.selectedIndex;
        this.imageName = select.options[selectedIndex].text;
        this.imageId = select.value;
        if (this.imageName === "AMIを選択") {
          this.changeState("error", "AMIを選択してください。", "#ff0000");
          return;
        }
      }
      this.confirmationMessage = message;
      this.modal = true;
    },
    /**
     * モーダルでの選択が「はい」だった場合に、対象メソッドを実行するメソッド
     * クリックしたボタンからのメッセージをもとに、実行するメソッドを判別
     */
    async executeMethod(yes, executeMethod) {
      this.modal = false;
      if (yes) {
        if (executeMethod === "createChangeSet") {
          await this.createChangeSet();
        } else if (executeMethod === "detectDrift") {
          await this.detectDrift();
        } else {
          await this.updateStack();
        }
      }
    },
    /**
     * 変更セットを作成するメソッド
     * スタックの更新前に削除予定のリソースがないかをチェックするために使用
     */
    async createChangeSet() {
      this.$disableButton([
        "create-change-set-btn",
        "detect-drift-btn",
        "update-stack-btn"
      ]);
      this.changeState("pending", "変更セット作成中", "#0064c8");

      try {
        const cloudformation = new CloudFormation(
          AWS,
          this.$store.state.credentials
        );
        const result = await cloudformation.createChangeSet(
          this.$stackName,
          this.imageId
        );
        const changeSet = await cloudformation.describeChangeSet(result.Id);
        if (changeSet === "FAILED") {
          this.changeState(
            "error",
            "変更セットの作成に失敗しました。CloudFormationコンソールでスタックを確認してください。",
            "#ff0000"
          );
          this.$enableButton([
            "create-change-set-btn",
            "detect-drift-btn",
            "update-stack-btn"
          ]);
          return;
        }

        for (let i = 0; i < changeSet.Changes.length; i++) {
          if (changeSet.Changes[i].ResourceChange.Action === "Remove") {
            this.changeState(
              "error",
              `次のリソースが削除される予定です。${changeSet.Changes[i].ResourceChange.LogicalResourceId}\n意図しない削除の場合、CloudFormationコンソールでスタックの詳細を確認してください。削除を許容する場合は、変更セットを作成せずに更新を行ってください。`,
              "#ff0000"
            );
            this.$enableButton([
              "create-change-set-btn",
              "detect-drift-btn",
              "update-stack-btn"
            ]);
            return;
          }
        }

        this.changeState(
          "complete",
          "変更セットを作成しました。削除予定のリソースはありません。",
          "#00c800"
        );
        this.$enableButton([
          "create-change-set-btn",
          "detect-drift-btn",
          "update-stack-btn"
        ]);
      } catch (err) {
        console.log(err);
        this.changeState(
          "error",
          `変更セットの作成中にエラーが発生しました。CloudFormationコンソールでスタックの確認してください。${err}`,
          "#ff0000"
        );
      }
      this.$enableButton([
        "create-change-set-btn",
        "detect-drift-btn",
        "update-stack-btn"
      ]);
    },
    /**
     * ドリフトの検出結果をチェックするメソッド
     */
    async detectDrift() {
      this.$disableButton([
        "create-change-set-btn",
        "detect-drift-btn",
        "update-stack-btn"
      ]);
      this.changeState("pending", "ドリフト検出中", "#0064c8");

      try {
        const cloudformation = new CloudFormation(
          AWS,
          this.$store.state.credentials
        );
        const driftResult = await cloudformation.detectStackDrift(
          this.$stackName
        );
        const driftStatus = await cloudformation.describeStackDriftDetectionStatus(
          driftResult.StackDriftDetectionId
        );
        if (driftStatus !== "IN_SYNC") {
          this.changeState(
            "error",
            "ドリフトが検出されました。変更されたリソースがあります。意図しない変更の場合、変更を元に戻してください。",
            "#ff0000"
          );
        } else {
          this.changeState(
            "complete",
            "ドリフトは検出されませんでした。",
            "#00c800"
          );
        }
        this.$enableButton([
          "create-change-set-btn",
          "detect-drift-btn",
          "update-stack-btn"
        ]);
      } catch (err) {
        console.log(err);
        this.changeState(
          "error",
          `ドリフトの検出中にエラーが発生しました。CloudFormationコンソールでスタックのドリフトの詳細を確認してください。${err}`,
          "#ff0000"
        );
        this.$enableButton([
          "create-change-set-btn",
          "detect-drift-btn",
          "update-stack-btn"
        ]);
      }
    },
    /**
     * CloudFormationスタックを更新するメソッド
     * 変更セットがある場合は変更セットを使用し、ない場合は直接更新となる
     */
    async updateStack() {
      this.$disableButton([
        "create-change-set-btn",
        "detect-drift-btn",
        "update-stack-btn"
      ]);
      this.changeState("pending", "更新中", "#0064c8");

      try {
        const cloudformation = new CloudFormation(
          AWS,
          this.$store.state.credentials
        );
        const changeSet = await cloudformation.listChangeSets(this.$stackName);
        if (changeSet.Summaries.length !== 0) {
          await cloudformation.executeChangeSet(
            changeSet.Summaries[0].ChangeSetId,
            changeSet.Summaries[0].StackName
          );
        } else {
          await cloudformation.updateStack(this.$stackName, this.imageId);
        }
        const isCompleted = await cloudformation.describeStackEvents(
          this.$stackName
        );
        if (!isCompleted) {
          this.changeState(
            "error",
            "CloudFormationスタックの更新中にエラーが発生しました。CloudFormationコンソールでスタックを確認してください。",
            "#ff0000"
          );
        } else {
          this.changeState(
            "complete",
            "CloudFormationスタックの更新が完了しました。",
            "#00c800"
          );
        }
      } catch (err) {
        console.log(err);
        this.changeState(
          "error",
          `CloudFormationスタックの更新中にエラーが発生しました。CloudFormationコンソールでスタックを確認してください。${err}`,
          "#ff0000"
        );
      }
      this.$enableButton([
        "create-change-set-btn",
        "detect-drift-btn",
        "update-stack-btn"
      ]);
    },
    /**
     * 更新アイコンクリック時にスタックの更新状況を取得、表示するメソッド。
     */
    async checkStackStateOnClick() {
      this.isLoading = true;

      try {
        const cloudformation = new CloudFormation(
          AWS,
          this.$store.state.credentials
        );
        const stackEvents = await cloudformation.listStackEvents(
          this.$stackName
        );
        if (stackEvents.length !== 0) {
          //リリース日のイベントのみ抽出する(yyyy-MM-dd)
          let now = new Date();
          now = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

          const state = [];
          const time = [];
          for (let i = 0; i < stackEvents.length; i++) {
            const timestamp = `${stackEvents[
              i
            ].Timestamp.getFullYear()}-${stackEvents[i].Timestamp.getMonth() +
              1}-${stackEvents[i].Timestamp.getDate()}`;
            if (now === timestamp) {
              state.push(
                `${stackEvents[i].LogicalResourceId} : ${stackEvents[i].ResourceStatus}`
              );
              time.push(stackEvents[i].Timestamp);
            }
          }

          for (let i = 0; i < state.length; i++) {
            //更新失敗
            if (state[i].includes("FAILED") || state[i].includes("ROLLBACK")) {
              this.pushEvent(time[i], state[i], "#ff0000");
            } else if (state[i] === `${this.$stackName} : UPDATE_COMPLETE`) {
              //更新完了
              this.pushEvent(time[i], state[i], "#00c800");
            } else {
              //更新中
              this.pushEvent(time[i], state[i], "#0064c8");
            }
          }

          if (state[0] === `${this.$stackName} : UPDATE_COMPLETE`) {
            this.changeState(
              "complete",
              "CloudFormationスタックの更新が完了しました。",
              "#00c800"
            );
          } else if (
            state[0].includes("FAILED") ||
            state[0].includes("ROLLBACK")
          ) {
            this.changeState(
              "error",
              "CloudFormationスタックの更新中にエラーが発生しました。CloudFormationコンソールでスタックを確認してください。",
              "#ff0000"
            );
          } else {
            this.changeState("pending", "更新中", "#0064c8");
          }
        }
      } catch (err) {
        console.log(err);
        this.changeState(
          "error",
          `CloudFormationスタックの更新中にエラーが発生しました。CloudFormationコンソールでスタックを確認してください。${err}`,
          "#ff0000"
        );
      }
      this.isLoading = false;
    },
    changeState(state, message, color) {
      this.state = state;
      this.updateMessage = message;
      this.color = color;
    },
    pushEvent(time, event, color) {
      if (!this.events.includes(`${time}${event}`)) {
        this.events.push(`${time}${event}`);
        const date = new Date(time).toLocaleString({ timeZone: "Asia/Tokyo" });
        this.messages.push({ date, event, color });
        this.messages.sort(function(a, b) {
          return new Date(b.date) - new Date(a.date);
        });
      }
    }
  }
};
</script>

<style scoped>
.main__container--select-image {
  margin: 35px auto;
  margin-bottom: 10px;
}

.main__container--pre-update-btn {
  margin: 30px;
  margin-bottom: 30px;
  display: inline-block;
  width: 130px;
}

.main__container--update-btn {
  margin: 10px auto;
  width: 80px;
}

.main__container--show-status {
  margin-top: 30px;
}

.main__container-uptate-message {
  font-weight: bold;
}

.main__container--status {
  border: var(--base-color) solid 2px;
  border-radius: 5px;
  background-color: var(--bg-color);
  margin-top: 10px;
}

.main__container--update-status {
  text-align: center;
  border-bottom: 2px solid var(--base-color);
  padding: 7px;
  padding-left: 15px;
  display: flex;
  justify-content: center;
  position: relative;
}

.main__container--status-header {
  margin: 0;
}

.main__container--reload-img {
  width: 25px;
  position: absolute;
  right: 3%;
  border: #000 solid 1px;
  border-radius: 8px;
}

.main__container--reload-wait-img {
  width: 20px;
  position: absolute;
  right: 3%;
  animation: 1s linear infinite rotation1;
}

@keyframes rotation1 {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

.main__container--reload-img:hover {
  cursor: pointer;
  border: #000 solid 2px;
}

.main__container--scroll {
  width: 500px;
  height: 300px;
  /* background-color: red; */
  overflow: scroll;
  margin: 0 auto;
  margin-top: 10px;
  text-align: left;
  padding-left: 15px;
}

.main__container--status-message {
  padding: 10px 0;
  border-bottom: var(--base-color) dotted 2px;
  font-weight: bold;
}
</style>
